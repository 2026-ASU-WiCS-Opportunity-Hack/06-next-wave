import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { question, org_id, role } = await request.json()

  if (!question) {
    return NextResponse.json({ error: 'No question provided' }, { status: 400 })
  }

  try {
    // Get events for context
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, name, event_date, org_id, service_types (name)')
      .order('event_date', { ascending: false })
      .limit(30)

    const { data: serviceTypes } = await supabaseAdmin
      .from('service_types')
      .select('name')

    const relevantEvents = role === 'nonprofit_admin' && org_id
      ? events?.filter(e => e.org_id === org_id)
      : events

    const eventList = relevantEvents?.map(e =>
      `- "${e.name}" (${e.event_date}, type: ${(e.service_types as any)?.name ?? 'General'})`
    ).join('\n') ?? 'No events found'

    const serviceTypeList = serviceTypes?.map(s => s.name).join(', ') ?? ''

    // Ask Claude to interpret
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are an analytics assistant for a nonprofit case management system.

Available events:
${eventList}

Available service types: ${serviceTypeList}

Demographic fields available:
- gender: "Male", "Female", "Non-binary", "Prefer not to say"
- language: "English", "Spanish", "Arabic", "Hindi", "French"
- household_size: number
- age groups: calculated from dob field

User question: "${question}"

Return ONLY a valid JSON object (no markdown):
{
  "interpretation": "Plain English explanation of what you understood",
  "filters": {
    "event_name_contains": "partial event name or null",
    "service_type": "exact service type name or null",
    "gender": "Male or Female or Non-binary or null",
    "language": "language name or null"
  },
  "aggregation": "count_clients or breakdown_gender or breakdown_language or breakdown_age"
}`
      }]
    })

    const text = (message.content[0] as any).text
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const queryPlan = JSON.parse(clean)

    // Fetch all clients with demographics
    let clientQuery = supabaseAdmin
      .from('clients')
      .select('id, dob, demographics, org_id')

    if (org_id && role === 'nonprofit_admin') {
      clientQuery = clientQuery.eq('org_id', org_id)
    }
    const { data: allClients } = await clientQuery

    // Fetch service entries separately
    let entriesQuery = supabaseAdmin
      .from('service_entries')
      .select('id, client_id, event_id, org_id')

    if (org_id && role === 'nonprofit_admin') {
      entriesQuery = entriesQuery.eq('org_id', org_id)
    }
    const { data: allEntries } = await entriesQuery

    // Fetch events for lookup
    const { data: allEvents } = await supabaseAdmin
      .from('events')
      .select('id, name, service_types (name)')

    const eventMap = new Map(allEvents?.map(e => [e.id, e]) ?? [])

    // Determine which client IDs match the event filter
    let matchingClientIds: Set<string> | null = null

    if (queryPlan.filters.event_name_contains || queryPlan.filters.service_type) {
      matchingClientIds = new Set()
      allEntries?.forEach(entry => {
        const ev = eventMap.get(entry.event_id)
        if (!ev) return

        const evName = (ev.name ?? '').toLowerCase()
        const evType = ((ev.service_types as any)?.name ?? '').toLowerCase()
        const nameFilter = queryPlan.filters.event_name_contains?.toLowerCase()
        const typeFilter = queryPlan.filters.service_type?.toLowerCase()

        const nameMatch = !nameFilter || evName.includes(nameFilter)
        const typeMatch = !typeFilter || evType.includes(typeFilter)

        if (nameMatch && typeMatch) {
          matchingClientIds!.add(entry.client_id)
        }
      })
    }

    // Filter clients
    let filtered = allClients ?? []

    if (matchingClientIds !== null) {
      filtered = filtered.filter(c => matchingClientIds!.has(c.id))
    }

    if (queryPlan.filters.gender) {
      filtered = filtered.filter(c =>
        c.demographics?.gender?.toLowerCase() === queryPlan.filters.gender.toLowerCase()
      )
    }

    if (queryPlan.filters.language) {
      filtered = filtered.filter(c =>
        c.demographics?.language?.toLowerCase() === queryPlan.filters.language.toLowerCase()
      )
    }

    // Compute result
    const agg = queryPlan.aggregation
    let result: any = {}

    if (agg === 'count_clients') {
      result = { type: 'count', value: filtered.length, label: 'clients' }
    } else if (agg === 'breakdown_gender') {
      const breakdown: Record<string, number> = {}
      filtered.forEach(c => {
        const g = c.demographics?.gender ?? 'Unknown'
        breakdown[g] = (breakdown[g] ?? 0) + 1
      })
      result = { type: 'breakdown', data: breakdown, label: 'by gender' }
    } else if (agg === 'breakdown_language') {
      const breakdown: Record<string, number> = {}
      filtered.forEach(c => {
        const l = c.demographics?.language ?? 'Unknown'
        breakdown[l] = (breakdown[l] ?? 0) + 1
      })
      result = { type: 'breakdown', data: breakdown, label: 'by language' }
    } else if (agg === 'breakdown_age') {
      const breakdown: Record<string, number> = {
        '0-17': 0, '18-30': 0, '31-50': 0, '51-65': 0, '65+': 0, 'Unknown': 0
      }
      filtered.forEach(c => {
        if (!c.dob) { breakdown['Unknown']++; return }
        const age = Math.floor(
          (Date.now() - new Date(c.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
        if (age < 18) breakdown['0-17']++
        else if (age < 31) breakdown['18-30']++
        else if (age < 51) breakdown['31-50']++
        else if (age < 66) breakdown['51-65']++
        else breakdown['65+']++
      })
      result = { type: 'breakdown', data: breakdown, label: 'by age group' }
    } else {
      result = { type: 'count', value: filtered.length, label: 'clients' }
    }

    return NextResponse.json({
      interpretation: queryPlan.interpretation,
      result,
      total_clients_in_filter: filtered.length,
    })

  } catch (err: any) {
    console.error('Analytics query error:', err)
    return NextResponse.json(
      { error: 'Failed to process question: ' + err.message },
      { status: 500 }
    )
  }
}