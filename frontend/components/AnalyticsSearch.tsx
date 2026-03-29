'use client'
import { useState } from 'react'

interface Props {
  orgId?: string
  role: string
}

const EXAMPLE_QUESTIONS = [
  'How many male clients attended food distribution events?',
  'How many clients speak Spanish?',
  'What is the gender breakdown for crisis intervention?',
  'How many clients are in the 18-30 age group?',
  'How many female clients received housing referrals?',
]

export default function AnalyticsSearch({ orgId, role }: Props) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleAsk = async (q?: string) => {
    const query = q ?? question
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/ai/analytics-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, org_id: orgId, role }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
        setQuestion(query)
      }
    } catch {
      setError('Failed to process question')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-[#1C1917] font-semibold text-lg">Ask Analytics</h3>
        <p className="text-[#78716C] text-sm mt-1">
          Ask questions about your clients in plain English
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="e.g. How many male clients attended food distribution?"
          className="flex-1 bg-[#F5F3F0] border border-[#D6D3D1] text-[#1C1917] placeholder-[#C4BFB9] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E07B54]"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          className="bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] font-medium px-5 py-3 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Thinking...
            </span>
          ) : 'Ask'}
        </button>
      </div>

      {/* Example questions */}
      <div>
        <p className="text-[#A8A29E] text-xs mb-2">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => { setQuestion(q); handleAsk(q) }}
              className="text-xs bg-[#F5F3F0] hover:bg-[#E7E5E4] text-[#57534E] px-3 py-1.5 rounded-lg transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#F5F3F0] rounded-xl p-5 space-y-4">
          {/* Interpretation */}
          <p className="text-[#78716C] text-sm italic">
            "{result.interpretation}"
          </p>

          {/* Count result */}
          {result.result.type === 'count' && (
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-[#E07B54]">
                {result.result.value}
              </span>
              <span className="text-[#57534E] text-lg">
                {result.result.label}
              </span>
            </div>
          )}

          {/* Breakdown result */}
          {result.result.type === 'breakdown' && (
            <div className="space-y-3">
              <p className="text-[#57534E] text-sm font-medium">
                Breakdown {result.result.label}
              </p>
              {Object.entries(result.result.data)
                .filter(([, v]) => (v as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([key, value]) => {
                  const total = Object.values(result.result.data)
                    .reduce((s: number, v) => s + (v as number), 0)
                  const pct = total > 0
                    ? Math.round(((value as number) / total) * 100)
                    : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#57534E] text-sm">{key}</span>
                        <span className="text-[#1C1917] font-medium text-sm">
                          {value as number}
                          <span className="text-[#A8A29E] ml-1">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}