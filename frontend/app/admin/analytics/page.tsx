import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import AnalyticsCharts from '@/components/AnalyticsCharts'
import DownloadAnalyticsPDF from '@/components/DownloadAnalyticsPDF' 
import AnalyticsSearch from '@/components/AnalyticsSearch'
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>
}) {
  const { org } = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations (name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'nonprofit_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const role = profile.role
  const orgName = (profile.organizations as any)?.name
  const filterOrgId = role === 'nonprofit_admin' ? profile.org_id : org ?? null

  const { data: allOrgs } = role === 'super_admin'
    ? await supabase.from('organizations').select('*').order('name')
    : { data: null }

  let selectedOrgName = 'All Nonprofits'
  if (filterOrgId && allOrgs) {
    selectedOrgName = allOrgs.find((o: any) => o.id === filterOrgId)?.name ?? 'All Nonprofits'
  } else if (role === 'nonprofit_admin') {
    selectedOrgName = orgName ?? 'Your Organization'
  }

  let clientsQuery = supabase.from('clients').select('*')
  let entriesQuery = supabase.from('service_entries').select('*, service_types (name)')
  let eventsQuery = supabase.from('events').select('*, service_types (name), organizations (name)')

  if (filterOrgId) {
    clientsQuery = clientsQuery.eq('org_id', filterOrgId)
    entriesQuery = entriesQuery.eq('org_id', filterOrgId)
    eventsQuery = eventsQuery.eq('org_id', filterOrgId)
  }

  const { data: clients } = await clientsQuery.order('created_at', { ascending: false })
  const { data: entries } = await entriesQuery
  const { data: events } = await eventsQuery.order('event_date', { ascending: false })
  const { data: serviceTypes } = await supabase.from('service_types').select('*').order('name')

  const now = new Date()

  const clientsByServiceType: Record<string, Set<string>> = {}
  entries?.forEach((e: any) => {
    const typeName = e.service_types?.name ?? 'Unknown'
    if (!clientsByServiceType[typeName]) clientsByServiceType[typeName] = new Set()
    clientsByServiceType[typeName].add(e.client_id)
  })
  const clientsPerType = Object.entries(clientsByServiceType)
    .map(([name, ids]) => ({ name, count: ids.size }))
    .sort((a, b) => b.count - a.count)

  const ageGroups: Record<string, number> = {
    '0-17': 0, '18-30': 0, '31-50': 0, '51-65': 0, '65+': 0, 'Unknown': 0
  }
  clients?.forEach(c => {
    if (!c.dob) { ageGroups['Unknown']++; return }
    const age = Math.floor(
      (now.getTime() - new Date(c.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    if (age < 18) ageGroups['0-17']++
    else if (age < 31) ageGroups['18-30']++
    else if (age < 51) ageGroups['31-50']++
    else if (age < 66) ageGroups['51-65']++
    else ageGroups['65+']++
  })
  const ageData = Object.entries(ageGroups).map(([label, count]) => ({ label, count }))

  const genderMap: Record<string, number> = {}
  clients?.forEach(c => {
    const g = c.demographics?.gender ?? 'Unknown'
    genderMap[g] = (genderMap[g] ?? 0) + 1
  })
  const genderData = Object.entries(genderMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  const langMap: Record<string, number> = {}
  clients?.forEach(c => {
    const l = c.demographics?.language ?? 'Unknown'
    langMap[l] = (langMap[l] ?? 0) + 1
  })
  const languageData = Object.entries(langMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  const weeklyTrend = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const count = entries?.filter(e => {
      const d = new Date(e.created_at)
      return d >= weekStart && d < weekEnd
    }).length ?? 0
    weeklyTrend.push({
      label: `W${8 - i}`,
      date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    })
  }

  const statsPerType = serviceTypes?.map(st => {
    const typeEntries = entries?.filter((e: any) => e.service_types?.name === st.name) ?? []
    const uniqueClients = new Set(typeEntries.map(e => e.client_id)).size
    return {
      name: st.name,
      total_entries: typeEntries.length,
      unique_clients: uniqueClients,
    }
  }).filter(s => s.total_entries > 0)
    .sort((a, b) => b.total_entries - a.total_entries) ?? []

  const orgBreakdown = role === 'super_admin' && !filterOrgId && allOrgs
    ? allOrgs.map((o: any) => ({
        id: o.id,
        name: o.name,
        clients: clients?.filter(c => c.org_id === o.id).length ?? 0,
        entries: entries?.filter((e: any) => e.org_id === o.id).length ?? 0,
        events: events?.filter((e: any) => e.org_id === o.id).length ?? 0,
      }))
    : null

  return (
    <Shell role={role} orgName={orgName}>
      <div className="space-y-8">

        {/* Header + org filter */}
<div className="flex items-start justify-between flex-wrap gap-4">
  <div>
    <h1 className="text-2xl font-bold text-white">Analytics</h1>
    <p className="text-slate-400 text-sm mt-1">{selectedOrgName}</p>
  </div>

  <div className="flex items-center gap-3 flex-wrap">
    {/* PDF Download */}
    <DownloadAnalyticsPDF
      orgName={selectedOrgName}
      stats={{
        totalClients: clients?.length ?? 0,
        totalEntries: entries?.length ?? 0,
        totalEvents: events?.length ?? 0,
      }}
      clientsPerType={clientsPerType}
      ageData={ageData}
      genderData={genderData}
      languageData={languageData}
      statsPerType={statsPerType}
      orgBreakdown={orgBreakdown}
    />

    {/* Org filter — super admin only */}
    {role === 'super_admin' && (
      <>
        <a href="/admin/analytics"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !filterOrgId
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}>
          All Orgs
        </a>
        {allOrgs?.map((o: any) => (
          <a key={o.id}
            href={`/admin/analytics?org=${o.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterOrgId === o.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}>
            {o.name.split(' ')[0]}
          </a>
        ))}
      </>
    )}
  </div>
</div>

        {/* Top stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: clients?.length ?? 0, color: 'text-blue-400' },
            { label: 'Service Entries', value: entries?.length ?? 0, color: 'text-green-400' },
            { label: 'Events', value: events?.length ?? 0, color: 'text-yellow-400' },
            { label: 'Active Service Types', value: statsPerType.length, color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Nonprofit breakdown table — super admin all orgs view */}
        {orgBreakdown && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-semibold">Nonprofit Breakdown</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 text-sm px-5 py-3">Organization</th>
                  <th className="text-right text-slate-400 text-sm px-5 py-3">Clients</th>
                  <th className="text-right text-slate-400 text-sm px-5 py-3">Service Entries</th>
                  <th className="text-right text-slate-400 text-sm px-5 py-3">Events</th>
                  <th className="text-right text-slate-400 text-sm px-5 py-3"></th>
                </tr>
              </thead>
              {/* AI Analytics Search */}
<AnalyticsSearch
  orgId={filterOrgId ?? profile?.org_id ?? undefined}
  role={role}
/>
              <tbody>
                {orgBreakdown.map((o, i) => (
                  <tr key={o.id}
                    className={`border-b border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-800/30'}`}>
                    <td className="text-white text-sm px-5 py-3 font-medium">{o.name}</td>
                    <td className="text-slate-300 text-sm px-5 py-3 text-right">{o.clients}</td>
                    <td className="text-slate-300 text-sm px-5 py-3 text-right">{o.entries}</td>
                    <td className="text-slate-300 text-sm px-5 py-3 text-right">{o.events}</td>
                    <td className="text-slate-300 text-sm px-5 py-3 text-right">
                      <a href={`/admin/analytics?org=${o.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        Drill down →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Charts */}
        <AnalyticsCharts
          clientsPerType={clientsPerType}
          ageData={ageData}
          genderData={genderData}
          languageData={languageData}
          weeklyTrend={weeklyTrend}
          statsPerType={statsPerType}
        />
      </div>
    </Shell>
  )
}