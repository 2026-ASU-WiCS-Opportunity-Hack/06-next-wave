'use client'
import { useRef, useState } from 'react'

export default function CsvImport({ orgId, userId }: { orgId?: string, userId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult('')

    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams()
    if (orgId) params.set('org_id', orgId)
    params.set('user_id', userId)

    const res = await fetch(`/api/import/clients?${params}`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()

    if (data.error) {
      setResult(`Failed: ${data.error}`)
    } else {
      setResult(`Successfully imported ${data.imported} clients`)
    }
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="bg-[#F5F3F0] hover:bg-[#E7E5E4] text-[#1C1917] text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border-2 border-[#E7E5E4] disabled:opacity-50"
      >
        {loading ? 'Importing...' : 'Upload CSV'}
      </button>
      {result && (
        <p className={`text-sm ${result.startsWith('Successfully') ? 'text-green-600' : 'text-red-500'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
