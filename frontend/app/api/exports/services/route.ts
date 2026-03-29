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
    .from('service_entries')
    .select(`
      date, notes, created_at,
      clients (full_name, phone),
      service_types (name),
      events (name),
      profiles (full_name)
    `)
    .order('date', { ascending: false })

  if (orgId) query = query.eq('org_id', orgId)

  const { data: entries } = await query

  const headers = [
    'client_name', 'client_phone', 'service_type',
    'event_name', 'date', 'notes', 'logged_by', 'created_at'
  ]

  const rows = entries?.map((e: any) => [
    e.clients?.full_name ?? '',
    e.clients?.phone ?? '',
    e.service_types?.name ?? '',
    e.events?.name ?? '',
    e.date ?? '',
    e.notes ?? '',
    e.profiles?.full_name ?? '',
    e.created_at ?? '',
  ]) ?? []

  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="carevo_service_entries.csv"',
    }
  })
}