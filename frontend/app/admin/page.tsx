'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [orgs, setOrgs] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'nonprofits'>('nonprofits')

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

    const { error } = await supabase
      .from('organizations')
      .insert(orgForm)

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

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
  const labelClass = "text-sm text-slate-400 mb-1 block"

  return (
    <Shell role={profile.role}>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <a href="/admin/analytics"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-4 py-2 rounded-lg transition-colors">
            📊 Analytics
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 w-fit">
          {[
            { key: 'nonprofits', label: 'Nonprofits' },
            { key: 'users', label: 'Users' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}

        {/* Nonprofits Tab */}
        {activeTab === 'nonprofits' && (
          <div className="space-y-6">
            {/* Create org form */}
            {profile.role === 'super_admin' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Add Nonprofit</h2>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Nonprofit'}
                </button>
              </div>
            )}

            {/* Orgs list */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                All Nonprofits ({orgs.length})
              </h2>
              <div className="space-y-2">
                {orgs.map(org => (
                  <div key={org.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{org.name}</p>
                        <p className="text-slate-400 text-sm">{org.address}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{org.email}</p>
                      </div>
                      <a href={`/admin/analytics?org=${org.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        Analytics →
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
            {/* Create user form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Create User</h2>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>

            {/* Users list */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                All Users ({staffList.length})
              </h2>
              <div className="space-y-2">
                {staffList.map(s => (
                  <div key={s.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{s.full_name}</p>
                      <p className="text-slate-400 text-sm">{s.email}</p>
                      <p className="text-slate-600 text-xs">
                        {(s.organizations as any)?.name ?? 'No org'}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      s.role === 'super_admin'
                        ? 'bg-blue-900 text-blue-300'
                        : s.role === 'nonprofit_admin'
                        ? 'bg-purple-900 text-purple-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {s.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}