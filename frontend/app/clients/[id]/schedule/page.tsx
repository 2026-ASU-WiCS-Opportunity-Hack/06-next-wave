
'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import Link from 'next/link'

export default function ScheduleClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = createClient()
  const router = useRouter()
  const [clientId, setClientId] = useState('')
  const [client, setClient] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setClientId(id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles')
        .select('*, organizations (name)')
        .eq('id', user.id)
        .single()
      setProfile(p)

      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      setClient(c)

      // Get upcoming events — filter by org if nonprofit_admin
      let evQuery = supabase
        .from('events')
        .select('*, service_types (name), organizations (name)')
        .gte('event_date', today)
        .order('event_date', { ascending: true })

      if (p?.role === 'nonprofit_admin') {
        evQuery = evQuery.eq('org_id', p.org_id)
      }

      const { data: events } = await evQuery
      setUpcomingEvents(events ?? [])

      // Get existing registrations for this client
      const { data: regs } = await supabase
        .from('client_event_registrations')
        .select('event_id')
        .eq('client_id', id)

      setRegisteredIds(new Set(regs?.map(r => r.event_id) ?? []))
    }
    load()
  }, [])

  const handleRegister = async (eventId: string) => {
    setLoading(eventId)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('client_event_registrations')
      .insert({
        client_id: clientId,
        event_id: eventId,
        registered_by: user?.id,
      })

    if (error) {
      setMessage(error.message)
    } else {
      setRegisteredIds(prev => new Set([...prev, eventId]))
      setMessage('')
    }
    setLoading(null)
  }

  const handleRemove = async (eventId: string) => {
    setLoading(eventId)

    await supabase
      .from('client_event_registrations')
      .delete()
      .eq('client_id', clientId)
      .eq('event_id', eventId)

    setRegisteredIds(prev => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
    setLoading(null)
  }

  if (!profile) return null

  const orgName = (profile?.organizations as any)?.name
  const registered = upcomingEvents.filter(e => registeredIds.has(e.id))
  const available = upcomingEvents.filter(e => !registeredIds.has(e.id))

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/schedule/${clientId}`
    : ''

  return (
    <Shell role={profile?.role} orgName={orgName}>
      <div className="max-w-2xl mx-auto space-y-6">

        <Link href={`/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-[#78716C] hover:text-[#1C1917] text-sm transition-colors">
          ← Back to Profile
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]">
            Schedule — {client?.full_name}
          </h1>
          <p className="text-[#78716C] text-sm mt-1">
            Register this client for upcoming events
          </p>
        </div>

        {/* Share link */}
        <div className="bg-[#FEF3EC] border border-[#F5C5A3] rounded-2xl p-5">
          <p className="text-sm font-medium text-[#1C1917] mb-2">
            📅 Client Schedule Link
          </p>
          <p className="text-xs text-[#78716C] mb-3">
            Share this link with the client — they can see their upcoming events without logging in
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-white border border-[#E7E5E4] text-[#57534E] text-xs rounded-xl px-3 py-2 focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl)
                setMessage('✓ Link copied!')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="bg-[#E07B54] hover:bg-[#C96B44] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Copy
            </button>
          </div>
          {message && (
            <p className={`text-xs mt-2 ${message.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Registered events */}
        <div>
          <h2 className="text-base font-semibold text-[#1C1917] mb-3">
            Registered Events ({registered.length})
          </h2>
          {registered.length === 0 ? (
            <p className="text-[#A8A29E] text-sm">Not registered for any upcoming events yet</p>
          ) : (
            <div className="space-y-2">
              {registered.map(ev => (
                <div key={ev.id}
                  className="bg-white border-2 border-[#E07B54] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1C1917] text-sm">{ev.name}</p>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      {new Date(ev.event_date).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })} · {ev.location}
                    </p>
                    <span className="text-xs bg-[#FEF3EC] text-[#E07B54] px-2 py-0.5 rounded-full mt-1 inline-block">
                      {(ev.service_types as any)?.name ?? 'General'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(ev.id)}
                    disabled={loading === ev.id}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 ml-4"
                  >
                    {loading === ev.id ? '...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available events */}
        <div>
          <h2 className="text-base font-semibold text-[#1C1917] mb-3">
            Upcoming Events ({available.length})
          </h2>
          {available.length === 0 ? (
            <p className="text-[#A8A29E] text-sm">No more upcoming events available</p>
          ) : (
            <div className="space-y-2">
              {available.map(ev => (
                <div key={ev.id}
                  className="bg-white border-2 border-[#E7E5E4] hover:border-[#E07B54] rounded-xl p-4 flex items-center justify-between transition-colors">
                  <div>
                    <p className="font-medium text-[#1C1917] text-sm">{ev.name}</p>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      {new Date(ev.event_date).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })} · {ev.location}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-[#F5F3F0] text-[#57534E] px-2 py-0.5 rounded-full">
                        {(ev.service_types as any)?.name ?? 'General'}
                      </span>
                      {profile?.role === 'super_admin' && (
                        <span className="text-xs text-[#A8A29E]">
                          {(ev.organizations as any)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRegister(ev.id)}
                    disabled={loading === ev.id}
                    className="bg-[#E07B54] hover:bg-[#C96B44] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0 ml-4"
                  >
                    {loading === ev.id ? '...' : '+ Register'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Shell>
  )
}
