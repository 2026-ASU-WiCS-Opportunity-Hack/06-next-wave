'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import CsvImport from '@/components/CsvImport'
import AuditLogView from '@/components/AuditLogView'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [orgs, setOrgs] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'nonprofits' | 'users' | 'data'>('nonprofits')

  const [userForm, setUserForm] = useState({
    email: '', password: '', full_name: '', role: 'staff', org_id: ''
  })
  const [orgForm, setOrgForm] = useState({
    name: '', email: '', phone: '', address: ''
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!p || !['super_admin', 'nonprofit_admin'].includes(p.role)) {
        router.push('/dashboard')
        return
      }
      setProfile(p)

      const { data: o } = await supabase
        .from('organizations')
        .select('*')
        .order('name')
      setOrgs(o ?? [])

      const { data: s } = await supabase
        .from('profiles')
        .select('*, organizations (name)')
        .order('created_at', { ascending: false })
      setStaffList(s ?? [])
    }
    load()
  }, [])

  const handleCreateOrg = async () => {
    if (!orgForm.name) return
    setLoading(true)
    setMessage('')
    const { error } = await supabase.from('organizations').insert(orgForm)
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('✓ Nonprofit created successfully')
      setOrgForm({ name: '', email: '', phone: '', address: '' })
      const { data: o } = await supabase.from('organizations').select('*').order('name')
      setOrgs(o ?? [])
    }
    setLoading(false)
  }

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.full_name) {
      setMessage('All fields are required')
      return
    }
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error ?? 'Failed to create user')
    } else {
      setMessage(`✓ User ${userForm.email} created`)
      setUserForm({ email: '', password: '', full_name: '', role: 'staff', org_id: '' })
      const { data: s } = await supabase
        .from('profiles')
        .select('*, organizations (name)')
        .order('created_at', { ascending: false })
      setStaffList(s ?? [])
    }
    setLoading(false)
  }

  if (!profile) return null

  const inputClass = "w-full bg-white border-2 border-[#E7E5E4] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54] transition-colors text-sm"
  const labelClass = "text-sm font-medium text-[#1C1917] mb-1.5 block"

  const clientsExportUrl = `/api/export/clients${profile.org_id ? `?org_id=${profile.org_id}` : ''}`
  const servicesExportUrl = `/api/export/services${profile.org_id ? `?org_id=${profile.org_id}` : ''}`

  return (
    <Shell role={profile.role}>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1C1917]">Admin Panel</h1>
          <a href="/admin/analytics"
            className="bg-[#F5F3F0] hover:bg-[#E7E5E4] text-[#57534E] text-sm px-4 py-2 rounded-lg transition-colors border border-[#E7E5E4]">
            Analytics
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F5F3F0] rounded-xl p-1 w-fit border border-[#E7E5E4]">
          {[
            { key: 'nonprofits', label: 'Nonprofits' },
            { key: 'users', label: 'Users' },
            { key: 'data', label: 'Data & Audit' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#E07B54] text-white'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        {/* Nonprofits Tab */}
        {activeTab === 'nonprofits' && (
          <div className="space-y-6">
            {profile.role === 'super_admin' && (
              <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-[#1C1917]">Add Nonprofit</h2>
                <div>
                  <label className={labelClass}>Organization Name *</label>
                  <input type="text" placeholder="ICM Food Bank"
                    value={orgForm.name}
                    onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                    className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" placeholder="info@org.org"
                      value={orgForm.email}
                      onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input type="tel" placeholder="480-555-0100"
                      value={orgForm.phone}
                      onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input type="text" placeholder="Chandler, AZ"
                    value={orgForm.address}
                    onChange={e => setOrgForm({ ...orgForm, address: e.target.value })}
                    className={inputClass} />
                </div>
                <button
                  onClick={handleCreateOrg}
                  disabled={loading || !orgForm.name}
                  className="w-full bg-[#E07B54] hover:bg-[#C96B44] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 text-sm">
                  {loading ? 'Creating...' : 'Create Nonprofit'}
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-[#1C1917] mb-4">
                All Nonprofits ({orgs.length})
              </h2>
              <div className="space-y-2">
                {orgs.map(org => (
                  <div key={org.id}
                    className="bg-white border-2 border-[#E7E5E4] rounded-xl px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#1C1917] font-medium">{org.name}</p>
                        <p className="text-[#78716C] text-sm">{org.address}</p>
                        <p className="text-[#A8A29E] text-xs mt-0.5">{org.email}</p>
                      </div>
                      <a href={`/admin/analytics?org=${org.id}`}
                        className="text-[#E07B54] hover:text-[#C96B44] text-sm transition-colors">
                        Analytics
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1C1917]">Create User</h2>
              <div>
                <label className={labelClass}>Full Name *</label>
                <input type="text" placeholder="Jane Worker"
                  value={userForm.full_name}
                  onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                  className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" placeholder="jane@org.com"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <input type="password" placeholder="Min 6 chars"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Role *</label>
                  <select value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    className={inputClass}>
                    <option value="staff">Staff</option>
                    <option value="nonprofit_admin">Nonprofit Admin</option>
                    {profile.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Organization *</label>
                  <select value={userForm.org_id}
                    onChange={e => setUserForm({ ...userForm, org_id: e.target.value })}
                    className={inputClass}>
                    <option value="">Select org</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreateUser}
                disabled={loading}
                className="w-full bg-[#E07B54] hover:bg-[#C96B44] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 text-sm">
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#1C1917] mb-4">
                All Users ({staffList.length})
              </h2>
              <div className="space-y-2">
                {staffList.map(s => (
                  <div key={s.id}
                    className="bg-white border-2 border-[#E7E5E4] rounded-xl px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[#1C1917] font-medium">{s.full_name}</p>
                      <p className="text-[#78716C] text-sm">{s.email}</p>
                      <p className="text-[#A8A29E] text-xs">
                        {(s.organizations as any)?.name ?? 'No org'}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      s.role === 'super_admin'
                        ? 'bg-blue-100 text-blue-700'
                        : s.role === 'nonprofit_admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-[#F5F3F0] text-[#57534E]'
                    }`}>
                      {s.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data & Audit Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">

            {/* Export */}
            <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1C1917]">Export Data</h2>
              <p className="text-sm text-[#78716C]">
                Download all data as CSV for grant reporting or migration to another system.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  href={clientsExportUrl}
                  download="carevo_clients.csv"
                  className="bg-[#E07B54] hover:bg-[#C96B44] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  Download Clients CSV
                </a>
                <a
                  href={servicesExportUrl}
                  download="carevo_service_entries.csv"
                  className="bg-[#1C1917] hover:bg-[#292524] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  Download Service Entries CSV
                </a>
              </div>
            </div>

            {/* Import */}
            <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1C1917]">Import Clients from CSV</h2>
              <p className="text-sm text-[#78716C]">
                Upload a CSV with columns:{' '}
                <code className="bg-[#F5F3F0] px-1.5 py-0.5 rounded text-xs">
                  full_name, dob, phone, email, location, gender, language, household_size
                </code>
              </p>
              <CsvImport orgId={profile.org_id} userId={profile.id} />
            </div>

            {/* Audit Log */}
            <AuditLogView orgId={profile.org_id} role={profile.role} />

          </div>
        )}
      </div>
    </Shell>
  )
}
