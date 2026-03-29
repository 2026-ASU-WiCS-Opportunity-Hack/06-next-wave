import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseCSV(text: string): { headers: string[], rows: string[][] } {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h =>
    h.toLowerCase().replace(/\s+/g, '_').replace(/"/g, '')
  )
  const rows = lines.slice(1).map(parseRow)
  return { headers, rows }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id is required' }, { status: 400 })

  // Get event details for service_type and org
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('id, name, org_id, service_types (id, name)')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Staff can only import for events they are assigned to
  if (profile.role === 'staff') {
    const { data: assignment } = await supabaseAdmin
      .from('event_staff')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('staff_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this event' }, { status: 403 })
    }
  }

  // Nonprofit admin can only import for their org's events
  if (profile.role === 'nonprofit_admin' && event.org_id !== profile.org_id) {
    return NextResponse.json({ error: 'Event does not belong to your organization' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text = await file.text()
  const { headers, rows } = parseCSV(text)

  if (headers.length === 0) {
    return NextResponse.json({ error: 'CSV must have a header row' }, { status: 400 })
  }

  if (!headers.includes('full_name') && !headers.includes('name')) {
    return NextResponse.json({ error: 'CSV must have a full_name column' }, { status: 400 })
  }

  const FIXED_COLUMNS = new Set(['full_name', 'name', 'dob', 'phone', 'email', 'notes'])
  const serviceTypeId = (event.service_types as any)?.id ?? null
  const orgId = event.org_id

  const get = (row: string[], key: string): string => {
    const idx = headers.indexOf(key)
    return idx >= 0 ? (row[idx] ?? '').trim() : ''
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fullName = get(row, 'full_name') || get(row, 'name')
    if (!fullName) { skipped++; continue }

    // Build demographics from non-fixed columns
    const demographics: Record<string, any> = {}
    headers.forEach((header, idx) => {
      if (FIXED_COLUMNS.has(header)) return
      const val = (row[idx] ?? '').trim()
      if (val) {
        if (['household_size', 'age', 'family_size'].includes(header)) {
          const num = Number(val)
          demographics[header] = isNaN(num) ? val : num
        } else {
          demographics[header] = val
        }
      }
    })

    try {
      // Create client
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          full_name: fullName,
          dob: get(row, 'dob') || null,
          phone: get(row, 'phone') || null,
          email: get(row, 'email') || null,
          demographics,
          org_id: orgId,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (clientError || !client) {
        errors.push(`Row ${i + 2}: ${clientError?.message ?? 'Failed to create client'}`)
        continue
      }

      // Create service entry for this event
      const notes = get(row, 'notes') || null
      const { error: entryError } = await supabaseAdmin
        .from('service_entries')
        .insert({
          client_id: client.id,
          event_id: eventId,
          service_type_id: serviceTypeId,
          staff_id: user.id,
          org_id: orgId,
          date: new Date().toISOString().split('T')[0],
          notes,
        })

      if (entryError) {
        errors.push(`Row ${i + 2}: Service entry failed — ${entryError.message}`)
        continue
      }

      imported++
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`)
    }
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    action: 'client.import',
    table_name: 'clients',
    user_id: user.id,
    org_id: orgId,
    summary: `Bulk imported ${imported} clients for event: ${event.name}`,
  })

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    errors: errors.slice(0, 10), // return first 10 errors max
  })
}
