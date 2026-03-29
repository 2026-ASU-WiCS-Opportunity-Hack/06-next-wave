import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default async function DashboardPage() {
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

  // ---- SUPER ADMIN: cross-org view ----
  if (role === 'super_admin') {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: totalEntries } = await supabase
      .from('service_entries')
      .select('*', { count: 'exact', head: true })

    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    const { data: recentEvents } = await supabase
      .from('events')
      .select('*, service_types (name), organizations (name)')
      .order('event_date', { ascending: false })
      .limit(5)

    return (
      <Shell role={role}>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Cross-organization overview</p>
          </div>

          {/* Global stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Nonprofits', value: orgs?.length ?? 0, color: 'text-blue-400' },
              { label: 'Total Clients', value: totalClients ?? 0, color: 'text-green-400' },
              { label: 'Service Entries', value: totalEntries ?? 0, color: 'text-purple-400' },
              { label: 'Total Events', value: totalEvents ?? 0, color: 'text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Nonprofits */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Nonprofits ({orgs?.length ?? 0})
              </h2>
              <Link href="/admin"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Add Nonprofit
              </Link>
            </div>
            <div className="grid gap-3">
              {orgs?.map(org => (
                <div key={org.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{org.name}</p>
                      <p className="text-slate-400 text-sm">{org.address} · {org.email}</p>
                    </div>
                    <Link href={`/admin/analytics?org=${org.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                      View Analytics →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent events across all orgs */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Events</h2>
            <div className="grid gap-3">
              {recentEvents?.map(event => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{event.name}</p>
                        <p className="text-slate-400 text-sm">
                          {(event.organizations as any)?.name} ·{' '}
                          {(event.service_types as any)?.name} ·{' '}
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-slate-500 text-sm">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  // ---- NONPROFIT ADMIN: org view ----
  if (role === 'nonprofit_admin') {
    const orgId = profile?.org_id

    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)

    const { count: totalEntries } = await supabase
      .from('service_entries')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)

    const { data: events } = await supabase
      .from('events')
      .select('*, service_types (name)')
      .eq('org_id', orgId)
      .order('event_date', { ascending: false })

    const { data: workers } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', orgId)
      .eq('role', 'staff')

    return (
      <Shell role={role} orgName={orgName}>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{orgName}</h1>
            <p className="text-slate-400 text-sm mt-1">Organization Dashboard</p>
          </div>

          {/* Org stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Clients', value: totalClients ?? 0, color: 'text-green-400' },
              { label: 'Service Entries', value: totalEntries ?? 0, color: 'text-purple-400' },
              { label: 'Events', value: events?.length ?? 0, color: 'text-yellow-400' },
              { label: 'Staff Members', value: workers?.length ?? 0, color: 'text-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Events ({events?.length ?? 0})
              </h2>
              <Link href="/events/new"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + New Event
              </Link>
            </div>
            <div className="grid gap-3">
              {events?.map(event => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{event.name}</p>
                        <p className="text-slate-400 text-sm">
                          {event.location} ·{' '}
                          {(event.service_types as any)?.name} ·{' '}
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-slate-500 text-sm">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Staff */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Staff ({workers?.length ?? 0})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {workers?.map(w => (
                <div key={w.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                  <p className="text-white text-sm font-medium">{w.full_name}</p>
                  <p className="text-slate-500 text-xs">{w.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  // ---- STAFF: assigned events only ----
  const { data: assignedEventIds } = await supabase
    .from('event_staff')
    .select('event_id')
    .eq('staff_id', user.id)

  const ids = assignedEventIds?.map(e => e.event_id) ?? []

  const { data: events } = ids.length > 0
    ? await supabase
        .from('events')
        .select('*, service_types (name)')
        .in('id', ids)
        .order('event_date', { ascending: false })
    : { data: [] }

  const { count: myClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)

  const { count: myEntries } = await supabase
    .from('service_entries')
    .select('*', { count: 'exact', head: true })
    .eq('staff_id', user.id)

  return (
    <Shell role={role} orgName={orgName}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {orgName} · {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Assigned Events', value: events?.length ?? 0, color: 'text-yellow-400' },
            { label: 'My Clients', value: myClients ?? 0, color: 'text-green-400' },
            { label: 'My Service Entries', value: myEntries ?? 0, color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Your Assigned Events</h2>
          {events?.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-400">No events assigned yet. Contact your org admin.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {events?.map(event => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{event.name}</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {event.location} ·{' '}
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                        {(event.service_types as any)?.name ?? 'General'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}