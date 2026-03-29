import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations (name)')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'staff'
  const orgName = (profile?.organizations as any)?.name

  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (role === 'nonprofit_admin') {
    query = query.eq('org_id', profile?.org_id)
  } else if (role === 'staff') {
    query = query.eq('created_by', user.id)
  }

  const { data: clients } = await query

  // Duplicate detection by phone
  const phoneCounts: Record<string, number> = {}
  clients?.forEach(c => {
    if (c.phone) phoneCounts[c.phone] = (phoneCounts[c.phone] ?? 0) + 1
  })
  const duplicatePhones = new Set(
    Object.entries(phoneCounts).filter(([, count]) => count > 1).map(([phone]) => phone)
  )
  const duplicateCount = clients?.filter(c => c.phone && duplicatePhones.has(c.phone)).length ?? 0

  return (
    <Shell role={role} orgName={orgName}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917]">Clients</h1>
            <p className="text-[#78716C] text-sm mt-0.5">
              {clients?.length ?? 0} total
            </p>
          </div>
          <Link
            href="/clients/new"
            className="bg-[#E07B54] hover:bg-[#C96B44] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Client
          </Link>
        </div>

        {duplicateCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <p className="text-yellow-700 text-sm font-medium">
              Warning: {duplicateCount} clients may be duplicates (matching phone numbers)
            </p>
          </div>
        )}

        {clients?.length === 0 ? (
          <div className="bg-white border-2 border-[#E7E5E4] rounded-xl p-12 text-center">
            <p className="text-[#A8A29E]">No clients yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {clients?.map(client => {
              const isDuplicate = client.phone && duplicatePhones.has(client.phone)
              return (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className={`bg-white rounded-xl p-4 transition-colors border-2 ${
                    isDuplicate
                      ? 'border-yellow-300 hover:border-yellow-400'
                      : 'border-[#E7E5E4] hover:border-[#E07B54]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1C1917]">{client.full_name}</p>
                          {isDuplicate && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Possible duplicate
                            </span>
                          )}
                        </div>
                        <p className="text-[#78716C] text-sm mt-0.5">
                          {client.phone ?? client.email ?? 'No contact info'}
                          {client.demographics?.location && (
                            <span className="ml-2 text-[#A8A29E]">
                              · {client.demographics.location}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-[#A8A29E] text-sm">→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Shell>
  )
}