import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: Request) {
  const { transcript, lang } = await request.json()

  if (!transcript) {
    return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
  }

  const langNote = lang === 'es'
    ? 'The transcript is in Spanish. Extract all fields and return values in English where appropriate (e.g. gender "Masculino" → "Male", "Femenino" → "Female").'
    : lang === 'fr'
    ? 'The transcript is in French. Extract all fields and return values in English where appropriate.'
    : 'The transcript is in English.'

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are extracting client intake information from a spoken transcript.

${langNote}

Transcript: "${transcript}"

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "full_name": string or null,
  "dob": string in YYYY-MM-DD format or null,
  "phone": string or null,
  "email": string or null,
  "location": string or null,
  "demographics": {
    "gender": "Male" or "Female" or "Non-binary" or null,
    "language": string or null,
    "household_size": number or null,
    "dietary_restrictions": string or null,
    "id_available": "yes" or "no" or null,
    "current_situation": string or null,
    "emergency_contact": string or null,
    "guardian_name": string or null,
    "guardian_phone": string or null,
    "age": number or null
  },
  "notes": string or null
}

Rules:
- Names: "John Smith" or "my name is John Smith" → "John Smith"
- Dates: "born March 5 1990" → "1990-03-05"  
- Phone: "480 555 1234" → "480-555-1234"
- Household: "family of 4" → 4
- Location: "lives in Chandler" or "from Phoenix" → "Chandler, AZ"
- Gender: normalize to English Male/Female/Non-binary
- Return ONLY raw JSON`
    }]
  })

  try {
    const text = (message.content[0] as any).text
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const extracted = JSON.parse(clean)
    return NextResponse.json(extracted)
  } catch (e) {
    console.error('Parse error:', e)
    return NextResponse.json({ error: 'Failed to parse extraction' }, { status: 500 })
  }
}