'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar({ role, orgName }: { role: string, orgName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/events', label: 'Events' },
    { href: '/clients', label: 'Clients' },
    ...(role === 'super_admin' ? [
      { href: '/admin', label: 'Admin' },
      { href: '/admin/analytics', label: 'Analytics' },
    ] : []),
    ...(role === 'nonprofit_admin' ? [
      { href: '/admin/analytics', label: 'Analytics' },
    ] : []),
  ]

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    nonprofit_admin: 'Org Admin',
    staff: 'Staff',
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
         <span className="text-[#E07B54] font-bold text-lg">Carevo</span>
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orgName && (
            <span className="text-xs text-slate-500 hidden md:block">
              {orgName}
            </span>
          )}
          <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wide ${
            role === 'super_admin'
              ? 'bg-blue-900 text-blue-300'
              : role === 'nonprofit_admin'
              ? 'bg-purple-900 text-purple-300'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {roleLabel[role] ?? role}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}