import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  let query = supabaseAdmin
    .from('clients')
    .select('full_name, dob, phone, email, location, demographics, created_at')
    .order('created_at', { ascending: false })

  if (orgId) query = query.eq('org_id', orgId)

  const { data: clients } = await query

  const headers = [
    'full_name', 'dob', 'phone', 'email', 'location',
    'gender', 'language', 'household_size', 'dietary_restrictions',
    'created_at'
  ]

  const rows = clients?.map(c => [
    c.full_name ?? '',
    c.dob ?? '',
    c.phone ?? '',
    c.email ?? '',
    c.location ?? '',
    c.demographics?.gender ?? '',
    c.demographics?.language ?? '',
    c.demographics?.household_size ?? '',
    c.demographics?.dietary_restrictions ?? '',
    c.created_at ?? '',
  ]) ?? []

  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="carevo_clients.csv"',
    }
  })
}