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
    .from('clients')
    .select('full_name, dob, phone, email, demographics, created_at')
    .order('created_at', { ascending: false })

  if (orgId) query = query.eq('org_id', orgId)

  const { data: clients, error } = await query

  if (error) {
    console.error('Export error:', error)
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }

  const headers = [
    'full_name', 'dob', 'phone', 'email', 'location',
    'gender', 'language', 'household_size', 'dietary_restrictions',
    'created_at'
  ]

  const rows = (clients ?? []).map(c => [
    c.full_name ?? '',
    c.dob ?? '',
    c.phone ?? '',
    c.email ?? '',
    c.demographics?.location ?? '',
    c.demographics?.gender ?? '',
    c.demographics?.language ?? '',
    c.demographics?.household_size ?? '',
    c.demographics?.dietary_restrictions ?? '',
    c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
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
      'Content-Disposition': 'attachment; filename="carevo_clients.csv"',
    }
  })
}