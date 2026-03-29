'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AddServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event_id')

  const [clientId, setClientId] = useState('')
  const [client, setClient] = useState<any>(null)
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    service_type_id: '',
    event_id: eventId ?? '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setClientId(id)

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      setClient(c)

      const { data: st } = await supabase
        .from('service_types')
        .select('*')
        .order('name')
      setServiceTypes(st ?? [])

      // Get events this staff member is assigned to
      const { data: assignedEvents } = await supabase
        .from('event_staff')
        .select('events (id, name, event_date)')
        .eq('staff_id', user?.id)
      setEvents(assignedEvents?.map((e: any) => e.events) ?? [])
    }
    load()
  }, [])

  const handleSubmit = async () => {
    if (!form.service_type_id) return
    setLoading(true)

    const { data: entry } = await supabase
      .from('service_entries')
      .insert({
        client_id: clientId,
        event_id: form.event_id || null,
        service_type_id: form.service_type_id,
        staff_id: user?.id,
        date: form.date,
        notes: form.notes || null,
      })
      .select()
      .single()

    // Trigger embedding
    if (entry && form.notes) {
      const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'
      fetch(`${aiUrl}/ai/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_entry_id: entry.id,
          text: form.notes,
        }),
      }).catch(() => {})
    }

    setLoading(false)
    router.push(`/clients/${clientId}`)
    router.refresh()
  }

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
  const labelClass = "text-sm text-slate-400 mb-1 block"

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-colors">
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Log Service</h1>
            {client && (
              <p className="text-slate-400 text-sm mt-0.5">
                for {client.full_name}
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">

          <div>
            <label className={labelClass}>Service Type *</label>
            <select
              value={form.service_type_id}
              onChange={e => setForm({ ...form, service_type_id: e.target.value })}
              className={inputClass}>
              <option value="">Select service type</option>
              {serviceTypes.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Link to Event (optional)</label>
            <select
              value={form.event_id}
              onChange={e => setForm({ ...form, event_id: e.target.value })}
              className={inputClass}>
              <option value="">No event</option>
              {events.map((ev: any) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} — {new Date(ev.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="What was provided? Any observations or follow-up needed?"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.service_type_id}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 text-lg"
        >
          {loading ? 'Saving...' : 'Log Service Entry'}
        </button>
      </div>
    </div>
  )
}