import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'nonprofit_admin'].includes(profile.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id') ?? profile.org_id

  let query = supabaseAdmin
    .from('service_entries')
    .select(`
      date, notes, created_at, org_id,
      clients (full_name, phone),
      service_types (name),
      events (name),
      profiles (full_name)
    `)
    .order('date', { ascending: false })

  if (orgId) query = query.eq('org_id', orgId)

  const { data: entries, error } = await query

  if (error) return new NextResponse('Error fetching data', { status: 500 })

  const headers = [
    'client_name', 'client_phone', 'service_type',
    'event_name', 'service_date', 'notes', 'logged_by', 'logged_at'
  ]

  const rows = (entries ?? []).map((e: any) => [
    e.clients?.full_name ?? '',
    e.clients?.phone ?? '',
    e.service_types?.name ?? '',
    e.events?.name ?? '',
    e.date ?? '',
    e.notes ?? '',
    e.profiles?.full_name ?? '',
    e.created_at ? new Date(e.created_at).toLocaleDateString() : '',
  ])

  const csv = [
    headers.join(','),
    ...rows.map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="carevo_service_entries.csv"',
    }
  })
}
