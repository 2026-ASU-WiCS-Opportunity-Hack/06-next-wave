'use client'
import { useRef, useState } from 'react'

interface Props {
  eventId: string
  eventName: string
  onSuccess: () => void
}

export default function EventCsvImport({ eventId, eventName, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [open, setOpen] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/import/event-clients?event_id=${eventId}`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)

    if (fileRef.current) fileRef.current.value = ''
    if (data.success && data.imported > 0) {
      setTimeout(() => {
        onSuccess()
      }, 1500)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#F5F3F0] hover:bg-[#E7E5E4] text-[#57534E] text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-[#E7E5E4]"
      >
        Bulk Upload CSV
      </button>

      {open && (
        <div className="mt-4 bg-white border-2 border-[#E7E5E4] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-[#1C1917] text-sm">
              Bulk Import Clients for {eventName}
            </h3>
            <p className="text-[#78716C] text-xs mt-1">
              Upload a CSV — each row becomes a client registered at this event.
              Only <code className="bg-[#F5F3F0] px-1 rounded">full_name</code> is required.
            </p>
          </div>

          {/* Template hint */}
          <div className="bg-[#FDFAF6] border border-[#E7E5E4] rounded-xl p-3">
            <p className="text-xs font-medium text-[#57534E] mb-1">Suggested columns:</p>
            <code className="text-xs text-[#78716C]">
              full_name, dob, phone, email, gender, language, household_size, dietary_restrictions, notes
            </code>
          </div>

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
            className="w-full bg-[#E07B54] hover:bg-[#C96B44] text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Choose CSV File'}
          </button>

          {result && (
            <div className={`rounded-xl p-4 text-sm space-y-1 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <>
                  <p className="font-medium text-green-700">
                    Successfully imported {result.imported} client{result.imported !== 1 ? 's' : ''}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-green-600 text-xs">
                      {result.skipped} rows skipped (missing full_name)
                    </p>
                  )}
                </>
              ) : (
                <p className="font-medium text-red-600">{result.error}</p>
              )}
              {result.errors?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-600">Row errors:</p>
                  {result.errors.map((err: string, i: number) => (
                    <p key={i} className="text-xs text-red-500">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
