'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await supabase.from('clients').delete().eq('id', clientId)
    router.push('/clients')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-[#78716C] text-sm">Remove {clientName}?</p>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-[#1C1917] text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Removing...' : 'Yes, remove'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[#78716C] hover:text-[#1C1917] text-sm px-3 py-1.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-red-400 hover:text-red-300 text-sm border border-red-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition-colors"
    >
      Remove Client
    </button>
  )
}