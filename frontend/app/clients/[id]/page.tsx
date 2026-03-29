import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'
// import Link from 'next/link'
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
    .select('*')
    .eq('id', user.id)
    .single()

  // Get client with creator info
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

  return (
    <Shell role={profile?.role ?? 'staff'}>
      <div className="space-y-8">

        {/* Back */}
        <Link href="/clients"
          className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back to Clients
        </Link>

        {/* Client Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
              <div className="flex gap-4 mt-2 text-slate-400 text-sm flex-wrap">
                {client.phone && <span> {client.phone}</span>}
                {client.email && <span> {client.email}</span>}
                {client.dob && (
                  <span> {new Date(client.dob).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
              {entries?.length ?? 0} visits
            </span>
          </div>
        <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
              {entries?.length ?? 0} visits
            </span>
            <Link
              href={`/clients/${id}/edit`}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full transition-colors"
            >
              Edit
            </Link>
          </div>
          {/* Demographics */}
          {Object.keys(demographics).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex gap-6 flex-wrap">
              {Object.entries(demographics).map(([key, value]) => (
                value ? (
                  <div key={key}>
                    <p className="text-slate-500 text-xs capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-white text-sm">{String(value)}</p>
                  </div>
                ) : null
              ))}
            </div>
          )}

          {/* Admin metadata */}
          {profile?.role === 'admin' && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-slate-500 text-xs">Registered by</p>
                    <p className="text-white text-sm">
                      {creator?.full_name ?? 'Unknown'}
                      <span className="text-slate-500 ml-1">
                        ({creator?.email ?? 'no email'})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Registered on</p>
                    <p className="text-white text-sm">
                      {new Date(client.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric',
                        year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Delete button — admin only */}
                <DeleteClientButton clientId={id} clientName={client.full_name} />
              </div>
            </div>
          )}
        </div>

        {/* Service History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Service History ({entries?.length ?? 0})
            </h2>
          </div>
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Service History ({entries?.length ?? 0})
          </h2>
          <Link
            href={`/clients/${id}/add-service`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Log Service
          </Link>
        </div>
          {entries?.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-400">No service entries yet for this client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries?.map((entry: any) => (
  <div key={entry.id}
    className="bg-slate-900 border border-slate-800 rounded-xl p-5">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-medium text-white">
          {entry.service_types?.name ?? 'General Service'}
        </p>
        {entry.events?.name && (
          <p className="text-blue-400 text-xs mt-0.5">
            @ {entry.events.name}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-white text-sm font-medium">
          Service date: {new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </p>
        <p className="text-slate-500 text-xs mt-0.5">
          Logged: {new Date(entry.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>
    </div>
    {entry.notes && (
      <p className="text-slate-400 text-sm">{entry.notes}</p>
    )}
    <p className="text-slate-600 text-xs mt-3">
      Logged by {entry.profiles?.full_name ?? 'Unknown'}
    </p>
  </div>
))}           </div>
          )}
        </div>

      </div>
    </Shell>
  )
}