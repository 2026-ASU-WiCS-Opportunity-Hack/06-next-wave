'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { serviceTypeFields, t, type Language, type DynamicField } from '@/lib/formTemplates'
import VoiceIntake from '@/components/VoiceIntake'

export default function NewClientPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event_id')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [lang, setLang] = useState<Language>('en')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState(eventId ?? '')
  const [user, setUser] = useState<any>(null)

  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    phone: '',
    email: '',
    gender: '',
    language: '',
    location: '',
  })
  const [demographics, setDemographics] = useState<Record<string, any>>({})
  const [serviceEntry, setServiceEntry] = useState({
    service_type_id: '',
    notes: '',
  })

  const isAdminRole = (role: string) =>
    ['super_admin', 'nonprofit_admin'].includes(role)

  const loadFormSchema = async (serviceTypeId: string, serviceTypeName: string) => {
    const { data } = await supabase
      .from('form_schemas')
      .select('fields')
      .eq('service_type_id', serviceTypeId)
      .single()

    if (data?.fields && data.fields.length > 0) {
      setDynamicFields(data.fields as DynamicField[])
      return
    }
    setDynamicFields(serviceTypeFields[serviceTypeName] ?? [])
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: p } = await supabase
        .from('profiles')
        .select('*, organizations (name)')
        .eq('id', user?.id)
        .single()
      setProfile(p)

      const { data: st } = await supabase
        .from('service_types')
        .select('*')
        .order('name')
      setServiceTypes(st ?? [])

      if (eventId) {
        const { data: ev } = await supabase
          .from('events')
          .select('*, service_types (id, name)')
          .eq('id', eventId)
          .single()
        setEvent(ev)
        setSelectedEventId(eventId)

        const stId = (ev?.service_types as any)?.id
        const stName = (ev?.service_types as any)?.name ?? ''
        if (stId) {
          setServiceEntry(prev => ({ ...prev, service_type_id: stId }))
          await loadFormSchema(stId, stName)
        }
      } else {
        if (p?.role === 'staff' && !eventId) {
  router.push('/events')
  return
}

        let evQuery = supabase
          .from('events')
          .select('*, service_types (id, name)')
          .order('event_date', { ascending: false })

        if (p?.role === 'nonprofit_admin') {
          evQuery = evQuery.eq('org_id', p.org_id)
        }

        const { data: evList } = await evQuery
        setEvents(evList ?? [])
      }
    }
    load()
  }, [eventId])

  const handleEventChange = async (evId: string) => {
    setSelectedEventId(evId)
    setDynamicFields([])
    setDemographics({})

    if (!evId) {
      setEvent(null)
      setServiceEntry(prev => ({ ...prev, service_type_id: '' }))
      return
    }

    const selected = events.find(e => e.id === evId)
    setEvent(selected)

    const stId = (selected?.service_types as any)?.id
    const stName = (selected?.service_types as any)?.name ?? ''

    if (stId) {
      setServiceEntry(prev => ({ ...prev, service_type_id: stId }))
      await loadFormSchema(stId, stName)
    }
  }

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'
      const res = await fetch(`${aiUrl}/ai/intake`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setForm({
        full_name: data.full_name ?? '',
        dob: data.dob ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        gender: data.demographics?.gender ?? '',
        language: data.demographics?.language ?? '',
        location: data.location ?? '',
      })
      if (data.demographics) {
        const { gender, language, ...rest } = data.demographics
        setDemographics(rest)
      }
    } catch (err) {
      console.error('Photo scan failed:', err)
    }
    setScanning(false)
  }

  const handleVoiceExtracted = (data: any) => {
    setForm({
      full_name: data.full_name ?? form.full_name,
      dob: data.dob ?? form.dob,
      phone: data.phone ?? form.phone,
      email: data.email ?? form.email,
      gender: data.demographics?.gender ?? form.gender,
      language: data.demographics?.language ?? form.language,
      location: data.location ?? form.location,
    })
    if (data.demographics) {
      const { gender, language, ...rest } = data.demographics
      const cleaned = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== null)
      )
      setDemographics(prev => ({ ...prev, ...cleaned }))
    }
    if (data.notes) {
      setServiceEntry(prev => ({
        ...prev,
        notes: prev.notes ? `${prev.notes}\n${data.notes}` : data.notes
      }))
    }
  }

  const handleSubmit = async () => {
    if (!form.full_name) { alert('Full name is required'); return }
    if (!form.gender) { alert('Gender is required'); return }
    if (!form.location) { alert('Location is required'); return }
    if (!selectedEventId) { alert('Please select an event first'); return }
    setLoading(true)

    const fullDemographics = {
      gender: form.gender,
      language: form.language,
      location: form.location,
      ...demographics,
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        full_name: form.full_name,
        dob: form.dob || null,
        phone: form.phone || null,
        email: form.email || null,
        demographics: fullDemographics,
        org_id: profile?.org_id ?? event?.org_id ?? null,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error || !client) { setLoading(false); return }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'client.create',
      table_name: 'clients',
      record_id: client.id,
      user_id: user?.id,
      org_id: profile?.org_id ?? event?.org_id ?? null,
      summary: `Registered new client: ${form.full_name}`,
    })

    const { data: entry } = await supabase
      .from('service_entries')
      .insert({
        client_id: client.id,
        event_id: selectedEventId || null,
        service_type_id: serviceEntry.service_type_id || null,
        staff_id: user?.id,
        org_id: profile?.org_id ?? event?.org_id ?? null,
        date: new Date().toISOString().split('T')[0],
        notes: serviceEntry.notes || null,
      })
      .select()
      .single()

    if (entry) {
      // Audit log service entry
      await supabase.from('audit_logs').insert({
        action: 'service.create',
        table_name: 'service_entries',
        record_id: entry.id,
        user_id: user?.id,
        org_id: profile?.org_id ?? event?.org_id ?? null,
        summary: `Logged service for ${form.full_name}`,
      })

      if (serviceEntry.notes) {
        const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'
        fetch(`${aiUrl}/ai/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service_entry_id: entry.id, text: serviceEntry.notes }),
        }).catch(() => {})
      }
    }

    setLoading(false)
    router.push(selectedEventId ? `/events/${selectedEventId}` : `/clients/${client.id}`)
  }

  const inputClass = "w-full bg-white border-2 border-[#E7E5E4] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54] transition-colors"
  const labelClass = "text-sm font-medium text-[#1C1917] mb-1.5 block"

  return (
    <div className="min-h-screen bg-[#FDFAF6] p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}
              className="text-[#78716C] hover:text-[#1C1917] transition-colors text-sm">
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917]">Register Client</h1>
              {event && (
                <p className="text-[#78716C] text-sm mt-0.5">@ {event.name}</p>
              )}
            </div>
          </div>
          {/* Language Toggle */}
          <div className="flex gap-1 bg-[#F5F3F0] rounded-xl p-1 border border-[#E7E5E4]">
            {(['en', 'es', 'fr'] as Language[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors uppercase ${
                  lang === l
                    ? 'bg-[#E07B54] text-white'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Event selector — admin only when not coming from an event */}
        {!eventId && isAdminRole(profile?.role) && (
          <div className="bg-white border-2 border-[#F5C5A3] rounded-2xl p-5">
            <label className={labelClass}>
              Select Event *
              <span className="text-[#A8A29E] ml-2 text-xs font-normal">
                (form fields change based on event type)
              </span>
            </label>
            <select
              value={selectedEventId}
              onChange={e => handleEventChange(e.target.value)}
              className={inputClass}>
              <option value="">Choose an event...</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} — {(ev.service_types as any)?.name ?? 'General'} ·{' '}
                  {new Date(ev.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {selectedEventId && event && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-[#FEF3EC] text-[#E07B54] px-3 py-1 rounded-full font-medium">
                  {(event.service_types as any)?.name ?? 'General'}
                </span>
                <span className="text-[#A8A29E] text-xs">Form fields loaded for this event type</span>
              </div>
            )}
          </div>
        )}

        {/* Block form if no event selected */}
        {!eventId && !selectedEventId && isAdminRole(profile?.role) ? (
          <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-12 text-center">
            <p className="text-[#A8A29E]">Select an event above to load the intake form</p>
          </div>
        ) : (
          <>
            {/* Photo to Intake */}
            <div className="bg-white border-2 border-dashed border-[#F5C5A3] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1C1917] font-medium">📸 {t('photo_intake', lang)}</p>
                  <p className="text-[#A8A29E] text-sm mt-0.5">
                    Upload a photo of a paper form — AI will fill the fields
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoScan}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="bg-[#E07B54] hover:bg-[#C96B44] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0">
                  {scanning ? t('uploading', lang) : t('photo_intake', lang)}
                </button>
              </div>
            </div>

            {/* Voice Intake */}
            <VoiceIntake onExtracted={handleVoiceExtracted} lang={lang} />

            {/* Core Fields */}
            <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-[#1C1917]">Client Information</h2>

              <div>
                <label className={labelClass}>{t('full_name', lang)} *</label>
                <input type="text" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Full name" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('dob', lang)}</label>
                  <input type="date" value={form.dob}
                    onChange={e => setForm({ ...form, dob: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('gender', lang)} *</label>
                  <select value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className={`${inputClass} ${!form.gender && form.full_name ? 'border-red-300' : ''}`}>
                    <option value="">Select</option>
                    <option value="Male">Male / Masculino</option>
                    <option value="Female">Female / Femenino</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('phone', lang)}</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="480-555-0100" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('email', lang)}</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="optional" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('language', lang)}</label>
                  <select value={form.language}
                    onChange={e => setForm({ ...form, language: e.target.value })}
                    className={inputClass}>
                    <option value="">Select language</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish / Español</option>
                    <option value="French">French / Français</option>
                    <option value="Arabic">Arabic / عربي</option>
                    <option value="Hindi">Hindi / हिन्दी</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Location *
                    <span className="text-[#A8A29E] text-xs ml-1 font-normal">(city, state)</span>
                  </label>
                  <input type="text" value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Chandler, AZ"
                    className={`${inputClass} ${!form.location && form.full_name ? 'border-red-300' : ''}`} />
                </div>
              </div>
            </div>

            {/* Dynamic Fields */}
            {dynamicFields.length > 0 && (
              <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1C1917]">
                    {(event?.service_types as any)?.name} Details
                  </h2>
                  <span className="text-xs bg-[#FEF3EC] text-[#E07B54] px-2 py-1 rounded-full font-medium">
                    Event-specific fields
                  </span>
                </div>
                {dynamicFields.map((field: DynamicField) => (
                  <div key={field.key}>
                    <label className={labelClass}>
                      {t(field.key, lang) !== field.key
                        ? t(field.key, lang)
                        : (field as any).label ?? field.key.replace(/_/g, ' ')}
                      {field.required && ' *'}
                    </label>
                    {field.type === 'boolean' ? (
                      <select
                        value={demographics[field.key] ?? ''}
                        onChange={e => setDemographics({ ...demographics, [field.key]: e.target.value })}
                        className={inputClass}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : field.type === 'select' && (field as any).options ? (
                      <select
                        value={demographics[field.key] ?? ''}
                        onChange={e => setDemographics({ ...demographics, [field.key]: e.target.value })}
                        className={inputClass}>
                        <option value="">Select</option>
                        {(field as any).options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type == 'textarea' ? (
                      <textarea
                        value={demographics[field.key] ?? ''}
                        onChange={e => setDemographics({ ...demographics, [field.key]: e.target.value })}
                        placeholder={(field as any).placeholder ?? ''}
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={demographics[field.key] ?? ''}
                        placeholder={(field as any).placeholder ?? ''}
                        onChange={e => setDemographics({ ...demographics, [field.key]: e.target.value })}
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Service Entry */}
            <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-[#1C1917]">Service Provided</h2>
              <div>
                <label className={labelClass}>Service Type</label>
                <select
                  value={serviceEntry.service_type_id}
                  onChange={e => setServiceEntry({ ...serviceEntry, service_type_id: e.target.value })}
                  className={inputClass}>
                  <option value="">Select service type</option>
                  {serviceTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('notes', lang)}</label>
                <textarea
                  value={serviceEntry.notes}
                  onChange={e => setServiceEntry({ ...serviceEntry, notes: e.target.value })}
                  rows={3}
                  placeholder="What was provided? Any follow-up needed?"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !form.full_name || !selectedEventId || !form.gender || !form.location}
              className="w-full bg-[#E07B54] hover:bg-[#C96B44] text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 text-lg">
              {loading ? 'Saving...' : t('submit', lang)}
            </button>
          </>
        )}
      </div>
    </div>
  )
}