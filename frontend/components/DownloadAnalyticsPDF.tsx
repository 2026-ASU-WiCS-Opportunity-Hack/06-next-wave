'use client'
import { useState } from 'react'

interface Props {
  orgName: string
  stats: {
    totalClients: number
    totalEntries: number
    totalEvents: number
  }
  clientsPerType: { name: string; count: number }[]
  ageData: { label: string; count: number }[]
  genderData: { label: string; count: number }[]
  languageData: { label: string; count: number }[]
  statsPerType: { name: string; total_entries: number; unique_clients: number }[]
  orgBreakdown?: { name: string; clients: number; entries: number; events: number }[] | null
}

export default function DownloadAnalyticsPDF({
  orgName, stats, clientsPerType, ageData,
  genderData, languageData, statsPerType, orgBreakdown
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    // Header
    doc.setFillColor(30, 58, 95)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('CareTrack Analytics Report', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${orgName} · Generated ${today}`, 14, 25)

    // Reset text color
    doc.setTextColor(0, 0, 0)
    let y = 40

    // Summary stats
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, y)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Clients', stats.totalClients.toString()],
        ['Service Entries', stats.totalEntries.toString()],
        ['Events', stats.totalEvents.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
      margin: { left: 14 },
      tableWidth: 80,
    })
    y = (doc as any).lastAutoTable.finalY + 12

    // Nonprofit breakdown (super admin only)
    if (orgBreakdown && orgBreakdown.length > 0) {
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Nonprofit Breakdown', 14, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [['Organization', 'Clients', 'Service Entries', 'Events']],
        body: orgBreakdown.map(o => [o.name, o.clients, o.entries, o.events]),
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
        margin: { left: 14 },
      })
      y = (doc as any).lastAutoTable.finalY + 12
    }

    // Clients by service type
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Clients by Service Type', 14, y)
    y += 8
    autoTable(doc, {
      startY: y,
      head: [['Service Type', 'Unique Clients', 'Total Entries', 'Avg Visits']],
      body: statsPerType.map(s => [
        s.name,
        s.unique_clients,
        s.total_entries,
        s.unique_clients > 0 ? (s.total_entries / s.unique_clients).toFixed(1) : '—'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
      margin: { left: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 12

    // New page for demographics
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Demographics', 14, y)
    y += 8

    // Age + Gender side by side
    autoTable(doc, {
      startY: y,
      head: [['Age Group', 'Count']],
      body: ageData.filter(d => d.count > 0).map(d => [d.label, d.count]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
      margin: { left: 14 },
      tableWidth: 80,
    })

    autoTable(doc, {
      startY: y,
      head: [['Gender', 'Count']],
      body: genderData.filter(d => d.count > 0).map(d => [d.label, d.count]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
      margin: { left: 110 },
      tableWidth: 80,
    })

    y = (doc as any).lastAutoTable.finalY + 12

    // Language
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Primary Languages', 14, y)
    y += 8
    autoTable(doc, {
      startY: y,
      head: [['Language', 'Count']],
      body: languageData.filter(d => d.count > 0).map(d => [d.label, d.count]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
      margin: { left: 14 },
      tableWidth: 80,
    })

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `CareTrack · Confidential · Page ${i} of ${pageCount}`,
        105, 290, { align: 'center' }
      )
    }

    doc.save(`CareTrack_Analytics_${orgName.replace(/\s+/g, '_')}_${today}.pdf`)
    setLoading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 bg-[#F5F3F0] hover:bg-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          📄 Download PDF
        </>
      )}
    </button>
  )
}