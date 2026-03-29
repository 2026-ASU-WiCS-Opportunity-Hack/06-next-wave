import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const userId = searchParams.get('user_id')

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV must have header + at least one row' }, { status: 400 })
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
  const rows = lines.slice(1)

  const clients = rows.map(row => {
    const values = row.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v =>
      v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    ) ?? []

    const get = (key: string) => {
      const idx = headers.indexOf(key)
      return idx >= 0 ? values[idx] ?? '' : ''
    }

    return {
      full_name: get('full_name') || get('name'),
      dob: get('dob') || null,
      phone: get('phone') || null,
      email: get('email') || null,
      location: get('location') || null,
      demographics: {
        gender: get('gender') || null,
        language: get('language') || null,
        household_size: get('household_size') ? Number(get('household_size')) : null,
        dietary_restrictions: get('dietary_restrictions') || null,
      },
      org_id: orgId,
      created_by: userId,
    }
  }).filter(c => c.full_name)

  if (clients.length === 0) {
    return NextResponse.json({ error: 'No valid clients found in CSV' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert(clients)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    imported: data?.length ?? 0,
  })
}