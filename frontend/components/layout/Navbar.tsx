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

  const roleBg: Record<string, string> = {
    super_admin: 'bg-blue-100 text-blue-700',
    nonprofit_admin: 'bg-purple-100 text-purple-700',
    staff: 'bg-stone-100 text-stone-600',
  }

  return (
    <nav className="border-b border-[#E7E5E4] bg-white px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E07B54] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <span className="font-bold text-[#1C1917]">CareVo</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-[#FEF3EC] text-[#E07B54]'
                    : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F3F0]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orgName && (
            <span className="text-xs text-[#A8A29E] hidden md:block">{orgName}</span>
          )}
          <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wide font-medium ${
            roleBg[role] ?? 'bg-stone-100 text-stone-600'
          }`}>
            {roleLabel[role] ?? role}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors border border-[#E7E5E4] px-3 py-1.5 rounded-lg hover:bg-[#F5F3F0]"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}