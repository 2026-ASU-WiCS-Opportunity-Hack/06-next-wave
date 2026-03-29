
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default async function ClientJourneyPage({
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

  if (!['super_admin', 'nonprofit_admin'].includes(profile?.role ?? '')) {
    redirect('/clients')
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) redirect('/clients')

  // Get full service history with event + staff info
  const { data: entries } = await supabase
    .from('service_entries')
    .select(`
      *,
      service_types (name),
      events (id, name, event_date, location),
      profiles (full_name)
    `)
    .eq('client_id', id)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  const orgName = (profile?.organizations as any)?.name
  const role = profile?.role ?? 'staff'

  // Group entries by event
  const eventMap = new Map<string, any>()
  entries?.forEach(entry => {
    const ev = entry.events as any
    const key = ev?.id ?? 'no-event'
    if (!eventMap.has(key)) {
      eventMap.set(key, {
        event: ev,
        entries: [],
        date: entry.date,
      })
    }
    eventMap.get(key).entries.push(entry)
  })
  const timeline = Array.from(eventMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const demographics = client.demographics ?? {}
  const firstSeen = entries?.[0]?.date
  const lastSeen = entries?.[entries.length - 1]?.date
  const totalVisits = entries?.length ?? 0

  const serviceTypeCounts: Record<string, number> = {}
  entries?.forEach((e: any) => {
    const name = e.service_types?.name ?? 'Unknown'
    serviceTypeCounts[name] = (serviceTypeCounts[name] ?? 0) + 1
  })

  return (
    <Shell role={role} orgName={orgName}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Back */}
        <Link href={`/clients/${id}`}
          className="inline-flex items-center gap-2 text-[#78716C] hover:text-[#1C1917] text-sm transition-colors">
          ← Back to Profile
        </Link>

        {/* Client Header */}
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917]">{client.full_name}</h1>
              <div className="flex gap-4 mt-2 text-[#78716C] text-sm flex-wrap">
                {client.phone && <span>📞 {client.phone}</span>}
                {demographics.location && <span>📍 {demographics.location}</span>}
                {demographics.language && <span>🌐 {demographics.language}</span>}
              </div>
            </div>
            <span className="text-xs bg-[#FEF3EC] text-[#E07B54] px-3 py-1 rounded-full font-medium">
              {totalVisits} total visits
            </span>
          </div>

          {/* Journey stats */}
          <div className="mt-5 pt-5 border-t border-[#E7E5E4] grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#A8A29E]">First Seen</p>
              <p className="text-[#1C1917] font-medium text-sm mt-0.5">
                {firstSeen
                  ? new Date(firstSeen).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A8A29E]">Last Seen</p>
              <p className="text-[#1C1917] font-medium text-sm mt-0.5">
                {lastSeen
                  ? new Date(lastSeen).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A8A29E]">Events Attended</p>
              <p className="text-[#1C1917] font-medium text-sm mt-0.5">{timeline.length}</p>
            </div>
          </div>

          {/* Service type breakdown */}
          {Object.keys(serviceTypeCounts).length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {Object.entries(serviceTypeCounts)
                .sort(([,a],[,b]) => b - a)
                .map(([type, count]) => (
                  <span key={type}
                    className="text-xs bg-[#F5F3F0] text-[#57534E] px-3 py-1 rounded-full">
                    {type} × {count}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-lg font-semibold text-[#1C1917] mb-6">Client Journey</h2>

          {timeline.length === 0 ? (
            <div className="bg-white border-2 border-[#E7E5E4] rounded-xl p-12 text-center">
              <p className="text-[#A8A29E]">No service history yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#E7E5E4]" />

              <div className="space-y-6">
                {timeline.map((item, idx) => {
                  const ev = item.event
                  const isLast = idx === timeline.length - 1
                  return (
                    <div key={idx} className="relative flex gap-5">
                      {/* Circle on timeline */}
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        isLast
                          ? 'bg-[#E07B54] border-[#E07B54] text-white'
                          : 'bg-white border-[#E7E5E4] text-[#A8A29E]'
                      }`}>
                        <span className="text-sm font-bold">{idx + 1}</span>
                      </div>

                      {/* Card */}
                      <div className="flex-1 bg-white border-2 border-[#E7E5E4] rounded-2xl p-5 hover:border-[#E07B54] transition-colors">
                        {/* Event header */}
                        {ev ? (
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Link href={`/events/${ev.id}`}
                                className="font-semibold text-[#1C1917] hover:text-[#E07B54] transition-colors">
                                {ev.name}
                              </Link>
                              <p className="text-xs text-[#A8A29E] mt-0.5">
                                📍 {ev.location}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-[#E07B54] shrink-0 ml-4">
                              {new Date(ev.event_date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-[#1C1917]">Direct Service</p>
                            <p className="text-sm font-medium text-[#E07B54]">
                              {new Date(item.date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}

                        {/* Service entries at this event */}
                        <div className="space-y-3">
                          {item.entries.map((entry: any, ei: number) => (
                            <div key={ei}
                              className={`${ei > 0 ? 'pt-3 border-t border-[#F5F3F0]' : ''}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-[#E07B54] bg-[#FEF3EC] px-2 py-0.5 rounded-full">
                                  {entry.service_types?.name ?? 'General Service'}
                                </span>
                                <span className="text-xs text-[#A8A29E]">
                                  by {entry.profiles?.full_name ?? 'Unknown'}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-sm text-[#57534E] mt-1 leading-relaxed">
                                  {entry.notes}
                                </p>
                              )}
                              <p className="text-xs text-[#A8A29E] mt-1.5">
                                Logged {new Date(entry.created_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
