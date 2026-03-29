'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { serviceTypeFields } from '@/lib/formTemplates'

export default function NewEventPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [newServiceTypeName, setNewServiceTypeName] = useState('')
  const [showNewType, setShowNewType] = useState(false)
  const [form, setForm] = useState({
    name: '',
    event_date: '',
    location: '',
    description: '',
    service_type_id: '',
    org_id: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from('profiles')
        .select('*, organizations (name)')
        .eq('id', user.id)
        .single()
      setProfile(p)

      // If nonprofit_admin, pre-set their org
      if (p?.role === 'nonprofit_admin' && p?.org_id) {
        setForm(prev => ({ ...prev, org_id: p.org_id }))
      }

      // If super_admin, load all orgs for dropdown
      if (p?.role === 'super_admin') {
        const { data: o } = await supabase
          .from('organizations')
          .select('*')
          .order('name')
        setOrgs(o ?? [])
      }

      const { data: st } = await supabase
        .from('service_types')
        .select('*')
        .order('name')
      setServiceTypes(st ?? [])

      // Load staff — filter by org if nonprofit_admin
      let staffQuery = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')
      if (p?.role === 'nonprofit_admin' && p?.org_id) {
        staffQuery = staffQuery.eq('org_id', p.org_id)
      }
      const { data: sl } = await staffQuery
      setStaffList(sl ?? [])
    }
    load()
  }, [])

  // When org changes for super_admin, reload staff for that org
  useEffect(() => {
    if (!form.org_id || profile?.role !== 'super_admin') return
    const loadStaff = async () => {
      const { data: sl } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')
        .eq('org_id', form.org_id)
      setStaffList(sl ?? [])
      setSelectedStaff([])
    }
    loadStaff()
  }, [form.org_id])

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleCreateNewServiceType = async () => {
    if (!newServiceTypeName.trim()) return
    setGenerating(true)

    const isStatic = Object.keys(serviceTypeFields).some(
      key => key.toLowerCase() === newServiceTypeName.toLowerCase()
    )

    const { data: newType, error } = await supabase
      .from('service_types')
      .insert({ name: newServiceTypeName.trim() })
      .select()
      .single()

    if (error || !newType) {
      setGenerating(false)
      return
    }

    if (!isStatic) {
      const res = await fetch('/api/ai/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type_name: newServiceTypeName }),
      })
      const data = await res.json()
      if (data.fields) {
        await supabase.from('form_schemas').insert({
          service_type_id: newType.id,
          fields: data.fields,
          generated_by: 'ai',
        })
      }
    }

    const { data: st } = await supabase
      .from('service_types')
      .select('*')
      .order('name')
    setServiceTypes(st ?? [])
    setForm(prev => ({ ...prev, service_type_id: newType.id }))
    setNewServiceTypeName('')
    setShowNewType(false)
    setGenerating(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.event_date || !form.org_id) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name: form.name,
        event_date: form.event_date,
        location: form.location,
        description: form.description,
        service_type_id: form.service_type_id || null,
        org_id: form.org_id,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error || !event) {
      console.error(error)
      setLoading(false)
      return
    }

    if (selectedStaff.length > 0) {
      await supabase.from('event_staff').insert(
        selectedStaff.map(staff_id => ({ event_id: event.id, staff_id }))
      )
    }

    router.push(`/events/${event.id}`)
  }

  const inputClass = "w-full bg-[#F5F3F0] border border-[#D6D3D1] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54]"
  const labelClass = "text-sm text-[#78716C] mb-1 block"

  return (
    <div className="min-h-screen bg-[#FDFAF6] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="text-[#78716C] hover:text-[#1C1917] transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-[#1C1917]">Create New Event</h1>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 space-y-5">

          {/* Org selector — super admin only */}
          {profile?.role === 'super_admin' && (
            <div>
              <label className={labelClass}>Nonprofit *</label>
              <select
                value={form.org_id}
                onChange={e => setForm({ ...form, org_id: e.target.value })}
                className={inputClass}>
                <option value="">Select nonprofit</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Event Name *</label>
            <input type="text"
              placeholder="e.g. Food Distribution - April 4"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Event Date *</label>
            <input type="date" value={form.event_date}
              onChange={e => setForm({ ...form, event_date: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input type="text"
              placeholder="e.g. ICM Food Bank, Chandler AZ"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              placeholder="What is this event about?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`} />
          </div>

          {/* Service Type */}
          <div>
            <label className={labelClass}>Service Type</label>
            <select
              value={form.service_type_id}
              onChange={e => setForm({ ...form, service_type_id: e.target.value })}
              className={inputClass}>
              <option value="">Select a service type</option>
              {serviceTypes.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowNewType(!showNewType)}
              className="mt-2 text-sm text-[#E07B54] hover:text-[#C96B44] transition-colors">
              + Create new service type
            </button>
          </div>

          {/* New service type */}
          {showNewType && (
            <div className="bg-[#F5F3F0] border border-[#F5C5A3] rounded-xl p-4 space-y-3">
              <p className="text-[#E07B54] text-sm font-medium">
                ✨ New service types will have their intake form auto-generated by AI
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Dental Care, Legal Aid..."
                  value={newServiceTypeName}
                  onChange={e => setNewServiceTypeName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateNewServiceType()}
                  className={inputClass} />
                <button
                  onClick={handleCreateNewServiceType}
                  disabled={generating || !newServiceTypeName.trim()}
                  className="bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0">
                  {generating ? 'Generating...' : 'Create + AI Form'}
                </button>
              </div>
              {generating && (
                <p className="text-[#78716C] text-xs">
                  AI is generating intake form fields for this service type...
                </p>
              )}
            </div>
          )}

          {/* Assign Staff */}
          <div>
            <label className={labelClass}>
              Assign Staff
              {profile?.role === 'super_admin' && !form.org_id && (
                <span className="text-[#A8A29E] ml-2">(select a nonprofit first)</span>
              )}
            </label>
            <div className="space-y-2">
              {staffList.length === 0 ? (
                <p className="text-[#A8A29E] text-sm">
                  {form.org_id ? 'No staff found for this org' : 'Select a nonprofit to see staff'}
                </p>
              ) : (
                staffList.map(s => (
                  <label key={s.id}
                    className="flex items-center gap-3 bg-[#F5F3F0] rounded-xl px-4 py-3 cursor-pointer hover:bg-[#E7E5E4] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(s.id)}
                      onChange={() => toggleStaff(s.id)}
                      className="w-4 h-4 accent-blue-500" />
                    <span className="text-[#1C1917] text-sm">{s.full_name}</span>
                    <span className="text-[#A8A29E] text-xs">{s.email}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.event_date || !form.org_id}
            className="w-full bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  )
}