'use client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  clientsPerType: { name: string; count: number }[]
  ageData: { label: string; count: number }[]
  genderData: { label: string; count: number }[]
  languageData: { label: string; count: number }[]
  weeklyTrend: { label: string; date: string; count: number }[]
  statsPerType: { name: string; total_entries: number; unique_clients: number }[]
}

const CORAL = '#E07B54'
const CORAL_LIGHT = 'rgba(224, 123, 84, 0.15)'
const STONE = '#78716C'
const COLORS = [
  '#E07B54', '#2DD4BF', '#818CF8', '#FB923C',
  '#34D399', '#60A5FA', '#F472B6', '#A78BFA'
]

export default function AnalyticsCharts({
  clientsPerType,
  ageData,
  genderData,
  languageData,
  weeklyTrend,
  statsPerType,
}: Props) {

  // Line chart — weekly trend
  const lineData = {
    labels: weeklyTrend.map(w => w.date),
    datasets: [{
      label: 'Service Entries',
      data: weeklyTrend.map(w => w.count),
      borderColor: CORAL,
      backgroundColor: CORAL_LIGHT,
      borderWidth: 2.5,
      pointBackgroundColor: CORAL,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.4,
    }]
  }

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1C1917',
        titleColor: '#FDFAF6',
        bodyColor: '#A8A29E',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: '#F5F3F0' },
        ticks: { color: STONE, font: { size: 11 } },
        border: { color: '#E7E5E4' },
      },
      y: {
        grid: { color: '#F5F3F0' },
        ticks: { color: STONE, font: { size: 11 }, stepSize: 1 },
        border: { color: '#E7E5E4' },
        beginAtZero: true,
      },
    },
  }

  // Bar chart — clients per service type
  const barData = {
    labels: clientsPerType.map(d => d.name),
    datasets: [{
      label: 'Unique Clients',
      data: clientsPerType.map(d => d.count),
      backgroundColor: clientsPerType.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 8,
      borderSkipped: false,
    }]
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1C1917',
        titleColor: '#FDFAF6',
        bodyColor: '#A8A29E',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: STONE, font: { size: 11 } },
        border: { color: '#E7E5E4' },
      },
      y: {
        grid: { color: '#F5F3F0' },
        ticks: { color: STONE, font: { size: 11 }, stepSize: 1 },
        border: { color: '#E7E5E4' },
        beginAtZero: true,
      },
    },
  }

  // Age bar chart
  const ageBarData = {
    labels: ageData.filter(d => d.count > 0).map(d => d.label),
    datasets: [{
      label: 'Clients',
      data: ageData.filter(d => d.count > 0).map(d => d.count),
      backgroundColor: '#818CF8',
      borderRadius: 6,
      borderSkipped: false,
    }]
  }

  // Doughnut — gender
  const genderFiltered = genderData.filter(d => d.count > 0)
  const genderDoughnut = {
    labels: genderFiltered.map(d => d.label),
    datasets: [{
      data: genderFiltered.map(d => d.count),
      backgroundColor: COLORS.slice(0, genderFiltered.length),
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    }]
  }

  // Doughnut — language
  const langFiltered = languageData.filter(d => d.count > 0)
  const langDoughnut = {
    labels: langFiltered.map(d => d.label),
    datasets: [{
      data: langFiltered.map(d => d.count),
      backgroundColor: ['#2DD4BF', '#FB923C', '#60A5FA', '#F472B6', '#34D399', '#A78BFA'],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    }]
  }

  const doughnutOptions = {
    responsive: true,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: STONE,
          font: { size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1C1917',
        titleColor: '#FDFAF6',
        bodyColor: '#A8A29E',
        padding: 12,
        cornerRadius: 8,
      },
    },
  }

  const smallBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1C1917',
        titleColor: '#FDFAF6',
        bodyColor: '#A8A29E',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: STONE, font: { size: 10 } },
        border: { color: '#E7E5E4' },
      },
      y: {
        grid: { color: '#F5F3F0' },
        ticks: { color: STONE, font: { size: 10 }, stepSize: 1 },
        border: { color: '#E7E5E4' },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">

      {/* Weekly Trend — Line Chart */}
      <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6">
        <h3 className="font-semibold text-[#1C1917] mb-1">Service Entries Trend</h3>
        <p className="text-xs text-[#A8A29E] mb-5">Last 8 weeks</p>
        <div className="h-52">
          <Line data={lineData} options={{ ...lineOptions, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Clients by Service Type — Bar Chart */}
      {clientsPerType.length > 0 && (
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-6">
          <h3 className="font-semibold text-[#1C1917] mb-1">Clients by Service Type</h3>
          <p className="text-xs text-[#A8A29E] mb-5">Unique clients per program</p>
          <div className="h-52">
            <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      {/* Demographics Row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Age Groups */}
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-5">
          <h3 className="font-semibold text-[#1C1917] mb-1 text-sm">Age Groups</h3>
          <p className="text-xs text-[#A8A29E] mb-4">Distribution</p>
          <div className="h-40">
            <Bar
              data={ageBarData}
              options={{ ...smallBarOptions, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Gender Doughnut */}
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-5">
          <h3 className="font-semibold text-[#1C1917] mb-1 text-sm">Gender</h3>
          <p className="text-xs text-[#A8A29E] mb-2">Breakdown</p>
          {genderFiltered.length > 0 ? (
            <div className="h-44">
              <Doughnut
                data={genderDoughnut}
                options={{ ...doughnutOptions, maintainAspectRatio: false }}
              />
            </div>
          ) : (
            <p className="text-[#A8A29E] text-sm text-center py-8">No data</p>
          )}
        </div>

        {/* Language Doughnut */}
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl p-5">
          <h3 className="font-semibold text-[#1C1917] mb-1 text-sm">Language</h3>
          <p className="text-xs text-[#A8A29E] mb-2">Primary language</p>
          {langFiltered.length > 0 ? (
            <div className="h-44">
              <Doughnut
                data={langDoughnut}
                options={{ ...doughnutOptions, maintainAspectRatio: false }}
              />
            </div>
          ) : (
            <p className="text-[#A8A29E] text-sm text-center py-8">No data</p>
          )}
        </div>
      </div>

      {/* Service Type Summary Table */}
      {statsPerType.length > 0 && (
        <div className="bg-white border-2 border-[#E7E5E4] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E7E5E4]">
            <h3 className="font-semibold text-[#1C1917]">Service Type Summary</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E7E5E4] bg-[#FDFAF6]">
                <th className="text-left text-[#A8A29E] text-xs font-medium px-6 py-3 uppercase tracking-wide">
                  Service Type
                </th>
                <th className="text-right text-[#A8A29E] text-xs font-medium px-6 py-3 uppercase tracking-wide">
                  Unique Clients
                </th>
                <th className="text-right text-[#A8A29E] text-xs font-medium px-6 py-3 uppercase tracking-wide">
                  Total Entries
                </th>
                <th className="text-right text-[#A8A29E] text-xs font-medium px-6 py-3 uppercase tracking-wide">
                  Avg Visits
                </th>
              </tr>
            </thead>
            <tbody>
              {statsPerType.map((st, i) => (
                <tr key={st.name}
                  className={`border-b border-[#E7E5E4] ${i % 2 === 0 ? '' : 'bg-[#FDFAF6]'}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-[#1C1917] text-sm font-medium">{st.name}</span>
                    </div>
                  </td>
                  <td className="text-[#57534E] text-sm px-6 py-3 text-right">
                    {st.unique_clients}
                  </td>
                  <td className="text-[#57534E] text-sm px-6 py-3 text-right">
                    {st.total_entries}
                  </td>
                  <td className="text-[#57534E] text-sm px-6 py-3 text-right">
                    {st.unique_clients > 0
                      ? (st.total_entries / st.unique_clients).toFixed(1)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}