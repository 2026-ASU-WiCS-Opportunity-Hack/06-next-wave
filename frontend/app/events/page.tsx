import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default async function EventsPage() {
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
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('events')
    .select('*, service_types (name), organizations (name)')

  if (role === 'nonprofit_admin') {
    query = query.eq('org_id', profile?.org_id)
  } else if (role === 'staff') {
    const { data: assigned } = await supabase
      .from('event_staff')
      .select('event_id')
      .eq('staff_id', user.id)
    const ids = assigned?.map(e => e.event_id) ?? []
    if (ids.length === 0) {
      return (
        <Shell role={role} orgName={orgName}>
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1C1917]">Events</h1>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
              <p className="text-[#78716C]">No events assigned yet. Contact your org admin.</p>
            </div>
          </div>
        </Shell>
      )
    }
    query = query.in('id', ids)
  }

  const { data: allEvents } = await query

  const upcoming = allEvents
    ?.filter(e => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date)) ?? []

  const past = allEvents
    ?.filter(e => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date)) ?? []

  const EventCard = ({ event }: { event: any }) => (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white border border-[#E7E5E4] hover:border-[#D6D3D1] rounded-xl p-5 transition-colors">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-[#1C1917]">{event.name}</p>
            <p className="text-[#78716C] text-sm">{event.location}</p>
            {role === 'super_admin' && (
              <p className="text-[#E07B54] text-xs">
                {(event.organizations as any)?.name}
              </p>
            )}
            {event.description && (
              <p className="text-[#A8A29E] text-sm">{event.description}</p>
            )}
          </div>
          <div className="text-right space-y-2 shrink-0 ml-4">
            <p className="text-sm text-[#1C1917] font-medium">
              {new Date(event.event_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </p>
            <span className="text-xs bg-[#F5F3F0] text-[#57534E] px-3 py-1 rounded-full block">
              {(event.service_types as any)?.name ?? 'General'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <Shell role={role} orgName={orgName}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1C1917]">Events</h1>
          {['super_admin', 'nonprofit_admin'].includes(role) && (
            <Link href="/events/new"
              className="bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + New Event
            </Link>
          )}
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-[#1C1917]">Upcoming</h2>
            <span className="bg-[#FEF3EC] text-[#C96B44] text-xs px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[#A8A29E] text-sm">No upcoming events</p>
          ) : (
            <div className="grid gap-3">
              {upcoming.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-[#1C1917]">Past Events</h2>
            <span className="bg-[#F5F3F0] text-[#78716C] text-xs px-2 py-0.5 rounded-full">
              {past.length}
            </span>
          </div>
          {past.length === 0 ? (
            <p className="text-[#A8A29E] text-sm">No past events</p>
          ) : (
            <div className="grid gap-3 opacity-75">
              {past.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}