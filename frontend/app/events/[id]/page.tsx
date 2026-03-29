import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default async function EventDetailPage({
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

  const { data: event } = await supabase
    .from('events')
    .select(`*, service_types (name)`)
    .eq('id', id)
    .single()

  if (!event) redirect('/events')

  const { data: assignedStaff } = await supabase
    .from('event_staff')
    .select(`profiles (id, full_name, email, role)`)
    .eq('event_id', id)

  // True event-wide totals — bypasses RLS via security definer function
  const { data: eventTotals } = await supabase
    .rpc('get_event_totals', { p_event_id: id })
  const totals = eventTotals?.[0]

  // Entries visible to THIS user only (RLS filtered)
  const { data: entries } = await supabase
    .from('service_entries')
    .select(`*, clients (id, full_name, phone, email), profiles (full_name)`)
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  // Unique clients from user's visible entries only
  const clientMap = new Map()
  entries?.forEach(e => {
    if (e.clients && !clientMap.has(e.clients.id)) {
      clientMap.set(e.clients.id, e.clients)
    }
  })
  // Get clients pre-registered for this event
const { data: preRegistered } = await supabase
  .from('client_event_registrations')
  .select('clients (id, full_name, phone)')
  .eq('event_id', id)
  const myClients = Array.from(clientMap.values())

  return (
    <Shell role={profile?.role ?? 'staff'}>
      <div className="space-y-8">

        {/* Event Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                {(event.service_types as any)?.name ?? 'General'}
              </p>
              <h1 className="text-2xl font-bold text-white">{event.name}</h1>
              <p className="text-slate-400">{event.location}</p>
              {event.description && (
                <p className="text-slate-500 text-sm mt-2">{event.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-white font-medium">
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long',
                  day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total clients at event — everyone sees this */}
          <div className="bg-slate-900 border border-blue-900 rounded-xl p-5">
            <p className="text-3xl font-bold text-blue-400">
              {totals?.total_clients ?? 0}
            </p>
            <p className="text-slate-400 text-sm mt-1">Total Clients at Event</p>
            <p className="text-slate-600 text-xs mt-1">All workers combined</p>
          </div>

          {/* Total entries at event — everyone sees this */}
          <div className="bg-slate-900 border border-blue-900 rounded-xl p-5">
            <p className="text-3xl font-bold text-blue-400">
              {totals?.total_entries ?? 0}
            </p>
            <p className="text-slate-400 text-sm mt-1">Total Service Entries</p>
            <p className="text-slate-600 text-xs mt-1">All workers combined</p>
          </div>

          {/* My clients — this worker's count */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-3xl font-bold text-white">{myClients.length}</p>
            <p className="text-slate-400 text-sm mt-1">
              {profile?.role === 'staff' ? 'Your Clients' : 'Visible Clients'}
            </p>
          </div>

          {/* Staff assigned */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-3xl font-bold text-white">
              {assignedStaff?.length ?? 0}
            </p>
            <p className="text-slate-400 text-sm mt-1">Staff Assigned</p>
          </div>
        </div>

        {/* Assigned Staff */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Assigned Staff</h2>
          <div className="flex gap-2 flex-wrap">
            {assignedStaff?.length === 0 ? (
              <p className="text-slate-500 text-sm">No staff assigned</p>
            ) : (
              assignedStaff?.map((es: any) => (
                <span key={es.profiles.id}
                  className="bg-slate-800 text-slate-300 text-sm px-3 py-1 rounded-full">
                  {es.profiles.full_name}
                </span>
              ))
            )}
          </div>
        </div>
        {/* Pre-registered clients */}
{preRegistered && preRegistered.length > 0 && (
  <div>
    <h2 className="text-base font-semibold text-[#1C1917] mb-3">
      Pre-registered ({preRegistered.length})
    </h2>
    <div className="flex gap-2 flex-wrap">
      {preRegistered.map((r: any) => (
        <Link key={r.clients.id} href={`/clients/${r.clients.id}`}>
          <span className="bg-[#FEF3EC] text-[#E07B54] text-sm px-3 py-1.5 rounded-full hover:bg-[#F5C5A3] transition-colors">
            {r.clients.full_name}
          </span>
        </Link>
      ))}
    </div>
  </div>
)}
        {/* Clients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {profile?.role === 'staff'
                ? `Your Clients (${myClients.length})`
                : `Clients Served (${myClients.length})`}
            </h2>
            <Link
              href={`/clients/new?event_id=${id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Add Client
            </Link>
          </div>

          {myClients.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-400 mb-4">
                {profile?.role === 'staff'
                  ? "You haven't added any clients at this event yet"
                  : 'No clients served yet at this event'}
              </p>
              <Link
                href={`/clients/new?event_id=${id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Add First Client
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {myClients.map((client: any) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{client.full_name}</p>
                        <p className="text-slate-400 text-sm">
                          {client.phone ?? client.email ?? 'No contact info'}
                        </p>
                      </div>
                      <span className="text-slate-500 text-sm">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Service Log */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {profile?.role === 'staff' ? 'Your Service Log' : 'Service Log'}
          </h2>
          {entries?.length === 0 ? (
            <p className="text-slate-500 text-sm">No service entries yet</p>
          ) : (
            <div className="space-y-3">
              {entries?.map((entry: any) => (
                <div key={entry.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-white">
                      {entry.clients?.full_name ?? 'Unknown Client'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-slate-400 text-sm">{entry.notes}</p>
                  <p className="text-slate-600 text-xs mt-2">
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