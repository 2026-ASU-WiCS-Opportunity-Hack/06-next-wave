import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function PublicSchedulePage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('full_name, demographics')
    .eq('id', clientId)
    .single()

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center">
        <p className="text-[#78716C]">Schedule not found</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: registrations } = await supabase
    .from('client_event_registrations')
    .select(`
      events (
        id, name, event_date, location, description,
        service_types (name),
        organizations (name)
      )
    `)
    .eq('client_id', clientId)

  const upcomingEvents = registrations
    ?.map((r: any) => r.events)
    .filter((e: any) => e && e.event_date >= today)
    .sort((a: any, b: any) => a.event_date.localeCompare(b.event_date))
    ?? []

  const pastEvents = registrations
    ?.map((r: any) => r.events)
    .filter((e: any) => e && e.event_date < today)
    .sort((a: any, b: any) => b.event_date.localeCompare(a.event_date))
    ?? []

  return (
    <div className="min-h-screen bg-[#FDFAF6]">

      {/* Header */}
      <div className="bg-white border-b border-[#E7E5E4] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E07B54] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <span className="font-bold text-[#1C1917]">CareVo</span>
          </div>
          <span className="text-xs text-[#A8A29E]">Client Schedule</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* Client greeting */}
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]">
            Hello, {client.full_name.split(' ')[0]} 👋
          </h1>
          <p className="text-[#78716C] mt-1">
            Here are your upcoming scheduled events
          </p>
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-[#1C1917]">Upcoming Events</h2>
            <span className="bg-[#FEF3EC] text-[#E07B54] text-xs px-2 py-0.5 rounded-full font-medium">
              {upcomingEvents.length}
            </span>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-[#1C1917] font-medium">No upcoming events</p>
              <p className="text-[#A8A29E] text-sm mt-1">
                Contact your case worker to get registered for upcoming events
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev: any) => {
                const date = new Date(ev.event_date)
                const isThisWeek = date.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                return (
                  <div key={ev.id}
                    className={`bg-white rounded-2xl p-5 border-2 ${
                      isThisWeek ? 'border-[#E07B54]' : 'border-[#E7E5E4]'
                    }`}>
                    {isThisWeek && (
                      <span className="text-xs bg-[#E07B54] text-white px-2 py-0.5 rounded-full font-medium mb-2 inline-block">
                        This week
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#1C1917]">{ev.name}</p>
                        <p className="text-sm text-[#78716C]">📍 {ev.location}</p>
                        {ev.description && (
                          <p className="text-sm text-[#A8A29E]">{ev.description}</p>
                        )}
                        <span className="text-xs bg-[#F5F3F0] text-[#57534E] px-2 py-0.5 rounded-full inline-block">
                          {ev.service_types?.name ?? 'General'}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-lg font-bold text-[#E07B54]">
                          {date.toLocaleDateString('en-US', { day: 'numeric' })}
                        </p>
                        <p className="text-xs text-[#78716C]">
                          {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[#A8A29E] mt-0.5">
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Past */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-[#1C1917] mb-4">Past Events</h2>
            <div className="space-y-2 opacity-60">
              {pastEvents.map((ev: any) => (
                <div key={ev.id}
                  className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1C1917] text-sm">{ev.name}</p>
                    <p className="text-xs text-[#78716C]">
                      {new Date(ev.event_date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="text-xs bg-[#F5F3F0] text-[#A8A29E] px-2 py-0.5 rounded-full">
                    Attended
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#E7E5E4] text-center">
          <p className="text-xs text-[#A8A29E]">
            Powered by{' '}
            <Link href="/" className="text-[#E07B54] hover:underline">CareVo</Link>
            {' '}· Questions? Contact your case worker
          </p>
        </div>
      </div>
    </div>
  )
}