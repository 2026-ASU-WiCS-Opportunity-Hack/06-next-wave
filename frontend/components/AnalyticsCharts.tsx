'use client'
import { useEffect, useRef } from 'react'

interface Props {
  clientsPerType: { name: string; count: number }[]
  ageData: { label: string; count: number }[]
  genderData: { label: string; count: number }[]
  languageData: { label: string; count: number }[]
  weeklyTrend: { label: string; date: string; count: number }[]
  statsPerType: { name: string; total_entries: number; unique_clients: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

function BarChart({ data, label }: { data: { label: string; count: number }[], label: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">{label}</h3>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={d.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300 text-sm truncate max-w-[60%]">{d.label}</span>
              <span className="text-slate-400 text-sm">{d.count}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ data, label }: { data: { label: string; count: number }[], label: string }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">{label}</h3>
      <div className="space-y-2">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
          return (
            <div key={d.label} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-slate-300 text-sm truncate">{d.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                  <span className="text-slate-400 text-xs w-8 text-right">{pct}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-slate-600 text-xs mt-3">Total: {total}</p>
    </div>
  )
}

function TrendChart({ data }: { data: { label: string; date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Weekly Service Entries (Last 8 Weeks)</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs">{d.count}</span>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max((d.count / max) * 100, 4)}%`,
                backgroundColor: i === data.length - 1 ? '#3b82f6' : '#334155',
                minHeight: '4px'
              }}
            />
            <span className="text-slate-500 text-xs">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsCharts({
  clientsPerType, ageData, genderData, languageData, weeklyTrend, statsPerType
}: Props) {
  return (
    <div className="space-y-6">

      {/* Trend */}
      <TrendChart data={weeklyTrend} />

      {/* Service type breakdown */}
      <BarChart
        data={clientsPerType.map(d => ({ label: d.name, count: d.count }))}
        label="Unique Clients by Service Type"
      />

      {/* Demographics grid */}
      <div className="grid grid-cols-3 gap-4">
        <BarChart
          data={ageData.filter(d => d.count > 0)}
          label="Age Groups"
        />
        <DonutChart
          data={genderData.filter(d => d.count > 0)}
          label="Gender Breakdown"
        />
        <DonutChart
          data={languageData.filter(d => d.count > 0)}
          label="Primary Language"
        />
      </div>

      {/* Service type stats table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">Service Type Summary</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 text-sm px-5 py-3">Service Type</th>
              <th className="text-right text-slate-400 text-sm px-5 py-3">Unique Clients</th>
              <th className="text-right text-slate-400 text-sm px-5 py-3">Total Entries</th>
              <th className="text-right text-slate-400 text-sm px-5 py-3">Avg Visits/Client</th>
            </tr>
          </thead>
          <tbody>
            {statsPerType.map((st, i) => (
              <tr key={st.name}
                className={`border-b border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-800/30'}`}>
                <td className="text-white text-sm px-5 py-3">{st.name}</td>
                <td className="text-slate-300 text-sm px-5 py-3 text-right">{st.unique_clients}</td>
                <td className="text-slate-300 text-sm px-5 py-3 text-right">{st.total_entries}</td>
                <td className="text-slate-300 text-sm px-5 py-3 text-right">
                  {st.unique_clients > 0
                    ? (st.total_entries / st.unique_clients).toFixed(1)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}