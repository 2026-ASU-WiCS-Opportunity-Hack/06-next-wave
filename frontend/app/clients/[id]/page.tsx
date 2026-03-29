import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'
import DeleteClientButton from '@/components/DeleteClientButton'

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations (name)')
    .eq('id', user.id)
    .single()

  const { data: client } = await supabase
    .from('clients')
    .select(`*, profiles (full_name, email)`)
    .eq('id', id)
    .single()

  if (!client) redirect('/clients')

  const { data: entries } = await supabase
    .from('service_entries')
    .select(`*, profiles (full_name), events (name), service_types (name)`)
    .eq('client_id', id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const demographics = client.demographics ?? {}
  const creator = (client as any).profiles
  const role = profile?.role ?? 'staff'
  const orgName = (profile?.organizations as any)?.name

  return (
    <Shell role={role} orgName={orgName}>
      <div className="space-y-8">

        {/* Back */}
        <Link href="/clients"
          className="inline-flex items-center gap-1 text-[#78716C] hover:text-[#1C1917] text-sm transition-colors">
          ← Back to Clients
        </Link>

        {/* Client Header */}
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#1C1917]">{client.full_name}</h1>
              <div className="flex gap-4 mt-2 text-[#78716C] text-sm flex-wrap">
                {client.phone && <span>📞 {client.phone}</span>}
                {client.email && <span>✉️ {client.email}</span>}
                {client.dob && (
                  <span>🎂 {new Date(client.dob).toLocaleDateString()}</span>
                )}
                {(client.location || demographics.location) && (
                  <span>📍 {client.location ?? demographics.location}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-xs bg-[#F5F3F0] text-[#57534E] px-3 py-1 rounded-full">
                {entries?.length ?? 0} visits
              </span>
              <Link
                href={`/clients/${id}/schedule`}
                className="text-xs bg-[#FEF3EC] hover:bg-[#F5C5A3] text-[#E07B54] px-3 py-1 rounded-full transition-colors font-medium">
                📅 Schedule
              </Link>
              {['super_admin', 'nonprofit_admin'].includes(role) && (
                <Link
                  href={`/clients/${id}/journey`}
                  className="text-xs bg-[#FEF3EC] hover:bg-[#F5C5A3] text-[#E07B54] px-3 py-1 rounded-full transition-colors font-medium">
                  🗺 Journey
                </Link>
              )}
              <Link
                href={`/clients/${id}/edit`}
                className="text-xs bg-[#F5F3F0] hover:bg-[#E7E5E4] text-[#57534E] px-3 py-1 rounded-full transition-colors">
                Edit
              </Link>
            </div>
          </div>

          {/* Demographics */}
          {Object.keys(demographics).length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E7E5E4] flex gap-6 flex-wrap">
              {demographics.location && (
                <div>
                  <p className="text-[#A8A29E] text-xs">📍 Location</p>
                  <p className="text-[#1C1917] text-sm font-medium">{demographics.location}</p>
                </div>
              )}
              {Object.entries(demographics).map(([key, value]) =>
                key === 'location' || !value ? null : (
                  <div key={key}>
                    <p className="text-[#A8A29E] text-xs capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-[#1C1917] text-sm">{String(value)}</p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Admin metadata */}
          {['super_admin', 'nonprofit_admin'].includes(role) && (
            <div className="mt-4 pt-4 border-t border-[#E7E5E4]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-[#A8A29E] text-xs">Registered by</p>
                    <p className="text-[#1C1917] text-sm">
                      {creator?.full_name ?? 'Unknown'}
                      <span className="text-[#A8A29E] ml-1 text-xs">
                        ({creator?.email ?? 'no email'})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[#A8A29E] text-xs">Registered on</p>
                    <p className="text-[#1C1917] text-sm">
                      {new Date(client.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <DeleteClientButton clientId={id} clientName={client.full_name} />
              </div>
            </div>
          )}
        </div>

        {/* Service History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1C1917]">
              Service History ({entries?.length ?? 0})
            </h2>
            <Link
              href={`/clients/${id}/add-service`}
              className="bg-[#E07B54] hover:bg-[#C96B44] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + Log Service
            </Link>
          </div>

          {entries?.length === 0 ? (
            <div className="bg-white border-2 border-[#E7E5E4] rounded-xl p-12 text-center">
              <p className="text-[#A8A29E]">No service entries yet for this client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries?.map((entry: any) => (
                <div key={entry.id}
                  className="bg-white border-2 border-[#E7E5E4] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-[#1C1917]">
                        {entry.service_types?.name ?? 'General Service'}
                      </p>
                      {entry.events?.name && (
                        <p className="text-[#E07B54] text-xs mt-0.5">
                          @ {entry.events.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[#1C1917] text-sm font-medium">
                        Service: {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                      <p className="text-[#A8A29E] text-xs mt-0.5">
                        Logged: {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-[#57534E] text-sm">{entry.notes}</p>
                  )}
                  <p className="text-[#A8A29E] text-xs mt-3">
                    Logged by {entry.profiles?.full_name ?? 'Unknown'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Shell>
  )
}