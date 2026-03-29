'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function AuditLogView({ orgId, role }: { orgId?: string, role: string }) {
  const supabase = createClient()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from('audit_logs')
        .select('*, profiles (full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (orgId && role === 'nonprofit_admin') {
        query = query.eq('org_id', orgId)
      }

      const { data } = await query
      setLogs(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const actionColor: Record<string, string> = {
    'client.create': 'bg-green-100 text-green-700',
    'client.update': 'bg-blue-100 text-blue-700',
    'client.delete': 'bg-red-100 text-red-700',
    'service.create': 'bg-purple-100 text-purple-700',
    'event.create': 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E7E5E4]">
        <h2 className="text-lg font-semibold text-[#1C1917]">Audit Log</h2>
        <p className="text-sm text-[#78716C] mt-0.5">
          Last 50 actions — no client PII stored
        </p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-[#A8A29E] text-sm">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-[#A8A29E] text-sm">
          No audit entries yet. Actions will appear here as staff use the system.
        </div>
      ) : (
        <div className="divide-y divide-[#F5F3F0]">
          {logs.map(log => (
            <div key={log.id} className="px-6 py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
                  actionColor[log.action] ?? 'bg-[#F5F3F0] text-[#57534E]'
                }`}>
                  {log.action}
                </span>
                <div>
                  <p className="text-sm text-[#1C1917]">{log.summary}</p>
                  <p className="text-xs text-[#A8A29E] mt-0.5">
                    by {(log.profiles as any)?.full_name ?? 'Unknown'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#A8A29E] shrink-0">
                {new Date(log.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
