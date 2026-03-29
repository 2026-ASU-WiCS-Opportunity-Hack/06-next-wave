import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: Request) {
  const { service_type_name } = await request.json()

  if (!service_type_name) {
    return NextResponse.json({ error: 'No service type provided' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are designing a client intake form for a nonprofit providing "${service_type_name}" services.

Generate a list of form fields appropriate for this service type. Return ONLY a valid JSON array.

Each field must follow this exact structure:
{
  "key": "snake_case_field_name",
  "label": "Human Readable Label",
  "type": "text" | "number" | "boolean" | "select" | "textarea",
  "options": ["option1", "option2"],  // only for type "select"
  "required": true | false,
  "placeholder": "optional placeholder text"
}

Rules:
- Generate 4-8 fields relevant to "${service_type_name}"
- Always include at least one required field
- Use "boolean" for yes/no questions
- Use "select" when there are clear fixed options (max 5 options)
- Use "textarea" for longer free-text fields
- Do NOT include: full_name, dob, phone, email, gender, language (those are always in the base form)
- Focus on service-specific details only
- Return ONLY the JSON array, no markdown, no explanation`
    }]
  })

  try {
    const text = (message.content[0] as any).text
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const fields = JSON.parse(clean)
    return NextResponse.json({ fields })
  } catch {
    return NextResponse.json({ error: 'Failed to generate form' }, { status: 500 })
  }
}