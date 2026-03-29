'use client'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEmailLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-[#E07B54] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <span className="font-bold text-2xl text-[#1C1917]">CareVo</span>
          </Link>
          <p className="text-[#78716C] text-sm">Sign in to your organization</p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@nonprofit.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
              className="w-full bg-white border-2 border-[#E7E5E4] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54] transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
              className="w-full bg-white border-2 border-[#E7E5E4] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54] transition-colors text-sm"
            />
          </div>

          {message && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {message}
            </div>
          )}

          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-xs text-[#A8A29E] mt-6">
          Built at{' '}
          <a href="https://ohack.dev" className="text-[#E07B54] hover:underline">
            Opportunity Hack 2026
          </a>
          {' '}· WiCS x OHack
        </p>
      </div>
    </div>
  )
}