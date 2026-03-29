import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Known fixed columns on the clients table
const FIXED_COLUMNS = new Set(['full_name', 'dob', 'phone', 'email'])

// These go into demographics JSONB — everything else does too
const KNOWN_DEMO_FIELDS = new Set([
  'gender', 'language', 'household_size', 'dietary_restrictions',
  'location', 'id_available', 'current_situation', 'emergency_contact',
  'guardian_name', 'guardian_phone', 'age', 'condition', 'insurance',
  'immediate_need', 'safe_location', 'family_size', 'pets',
  'dietary_restrictions', 'school'
])

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
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
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

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
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

  if (!profile || !['super_admin', 'nonprofit_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id') ?? profile.org_id

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text = await file.text()
  const { headers, rows } = parseCSV(text)

  if (headers.length === 0) {
    return NextResponse.json({ error: 'CSV must have a header row' }, { status: 400 })
  }

  if (!headers.includes('full_name') && !headers.includes('name')) {
    return NextResponse.json({
      error: 'CSV must have a full_name (or name) column'
    }, { status: 400 })
  }

  const get = (row: string[], key: string): string => {
    const idx = headers.indexOf(key)
    return idx >= 0 ? (row[idx] ?? '').trim() : ''
  }

  const clients = rows
    .map(row => {
      const fullName = get(row, 'full_name') || get(row, 'name')
      if (!fullName) return null

      // Build demographics from ALL non-fixed columns
      const demographics: Record<string, any> = {}
      headers.forEach((header, idx) => {
        if (FIXED_COLUMNS.has(header)) return
        if (header === 'name') return
        const val = (row[idx] ?? '').trim()
        if (val) {
          // Convert household_size to number if possible
          if (header === 'household_size' || header === 'age' || header === 'family_size') {
            const num = Number(val)
            demographics[header] = isNaN(num) ? val : num
          } else {
            demographics[header] = val
          }
        }
      })

      return {
        full_name: fullName,
        dob: get(row, 'dob') || null,
        phone: get(row, 'phone') || null,
        email: get(row, 'email') || null,
        demographics,
        org_id: orgId ?? null,
        created_by: user.id,
      }
    })
    .filter(Boolean)

  if (clients.length === 0) {
    return NextResponse.json({ error: 'No valid rows found (missing full_name)' }, { status: 400 })
  }

  // Insert in batches of 50 to avoid payload limits
  let imported = 0
  const batchSize = 50
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize)
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert(batch)
      .select('id')

    if (error) {
      console.error('Import batch error:', error)
      return NextResponse.json({
        error: `Import failed on batch starting at row ${i + 1}: ${error.message}`
      }, { status: 500 })
    }
    imported += data?.length ?? 0
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    action: 'client.import',
    table_name: 'clients',
    user_id: user.id,
    org_id: orgId ?? null,
    summary: `Imported ${imported} clients via CSV`,
  })
  // After successful import, get the org_id from the first client's org
// not from the user's profile (super_admin has no org)
await supabaseAdmin.from('audit_logs').insert({
  action: 'client.import',
  table_name: 'clients',
  user_id: user.id,
  org_id: orgId ?? null,  // orgId comes from the ?org_id= param
  summary: `Imported ${imported} clients via CSV`,
})

  return NextResponse.json({ success: true, imported })
}
