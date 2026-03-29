import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  const { data: clients } = await query

  // Duplicate detection — admin only
  // Only check clients with non-null, non-empty phone numbers
  let duplicatePhones: Set<string> = new Set()
  if (profile?.role === 'admin' && clients) {
    const phoneCount: Record<string, number> = {}
    clients.forEach(c => {
      const phone = c.phone?.trim()
      if (phone && phone.length > 0) {
        phoneCount[phone] = (phoneCount[phone] ?? 0) + 1
      }
    })
    duplicatePhones = new Set(
      Object.entries(phoneCount)
        .filter(([, count]) => count > 1)
        .map(([phone]) => phone)
    )
  }

  return (
    <Shell role={profile?.role ?? 'staff'}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917]">Clients</h1>
            {profile?.role === 'staff' && (
              <p className="text-[#A8A29E] text-sm mt-0.5">
                Showing clients you registered
              </p>
            )}
          </div>
          <Link href="/clients/new"
            className="bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New Client
          </Link>
        </div>

        {/* Duplicate warning — admin only */}
        {profile?.role === 'admin' && duplicatePhones.size > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl px-4 py-3">
            <p className="text-yellow-400 text-sm font-medium">
              ⚠️ {duplicatePhones.size} possible duplicate{duplicatePhones.size > 1 ? 's' : ''} detected — same phone number registered by multiple workers
            </p>
          </div>
        )}

        {/* Search */}
        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search clients by name..."
            className="w-full bg-white border border-[#E7E5E4] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54]"
          />
        </form>

        {/* Client list */}
        <div className="grid gap-3">
          {clients?.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
              <p className="text-[#78716C]">
                {q ? `No clients found for "${q}"` : 'No clients yet'}
              </p>
            </div>
          ) : (
            clients?.map(client => {
              const phone = client.phone?.trim()
              const isDuplicate = phone && duplicatePhones.has(phone)
              return (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className={`bg-white border rounded-xl p-4 transition-colors ${
                    isDuplicate
                      ? 'border-yellow-700 hover:border-yellow-500'
                      : 'border-[#E7E5E4] hover:border-[#D6D3D1]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1C1917]">{client.full_name}</p>
                          {isDuplicate && (
                            <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full">
                              Possible duplicate
                            </span>
                          )}
                        </div>
                        <p className="text-[#78716C] text-sm mt-0.5">
                          {phone ?? client.email ?? 'No contact info'} ·{' '}
                          {client.demographics?.language ?? 'Language unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#A8A29E] text-xs">
                          {new Date(client.created_at).toLocaleDateString()}
                        </p>
                        <span className="text-[#A8A29E] text-sm">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </Shell>
  )
}