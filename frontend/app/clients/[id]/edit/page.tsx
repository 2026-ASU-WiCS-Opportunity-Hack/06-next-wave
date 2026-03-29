'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    phone: '',
    email: '',
    gender: '',
    language: '',
  })
  const [demographics, setDemographics] = useState<Record<string, any>>({})

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setClientId(id)

      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (!client) { router.push('/clients'); return }

      setForm({
        full_name: client.full_name ?? '',
        dob: client.dob ?? '',
        phone: client.phone ?? '',
        email: client.email ?? '',
        gender: client.demographics?.gender ?? '',
        language: client.demographics?.language ?? '',
      })

      const { gender, language, ...rest } = client.demographics ?? {}
      setDemographics(rest)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!form.full_name) return
    setLoading(true)

    const fullDemographics = {
      gender: form.gender,
      language: form.language,
      ...demographics,
    }

    await supabase
      .from('clients')
      .update({
        full_name: form.full_name,
        dob: form.dob || null,
        phone: form.phone || null,
        email: form.email || null,
        demographics: fullDemographics,
      })
      .eq('id', clientId)

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
          <h1 className="text-2xl font-bold text-white">Edit Client</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={form.dob}
                onChange={e => setForm({ ...form, dob: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                className={inputClass}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Primary Language</label>
            <select value={form.language}
              onChange={e => setForm({ ...form, language: e.target.value })}
              className={inputClass}>
              <option value="">Select</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Arabic">Arabic</option>
              <option value="Hindi">Hindi</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Dynamic demographics fields */}
          {Object.keys(demographics).length > 0 && (
            <div className="pt-4 border-t border-slate-700 space-y-4">
              <p className="text-slate-400 text-sm">Additional Details</p>
              {Object.entries(demographics).map(([key, value]) => (
                <div key={key}>
                  <label className={labelClass}>
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={String(value ?? '')}
                    onChange={e => setDemographics({
                      ...demographics, [key]: e.target.value
                    })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !form.full_name}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 text-lg"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}