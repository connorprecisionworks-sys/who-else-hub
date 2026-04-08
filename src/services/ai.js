const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY
const MODEL = 'gpt-4.1-mini'

const SYSTEM_PROMPT = `You are a quick-access AI assistant for Connor. Context:
- Runs an AI integration consulting firm
- Student at a university
- Does web development and vibe coding
- Manages multiple client projects
- Regularly creates content: video scripts, how-to guides, tutorials
- Faith-driven, high-agency builder

Be concise, practical, and action-oriented. Keep responses short and useful unless asked for detail.`

if (!OPENAI_KEY) console.warn('[ai] VITE_OPENAI_API_KEY is not set — AI features will not work')

async function complete(messages, maxTokens = 1000) {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not set — add it to your .env file')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export async function chat(messages) {
  return complete(messages)
}

export async function rewriteText(text, tone) {
  return complete([
    { role: 'user', content: `Rewrite the following text in a ${tone} tone. Return only the rewritten text.\n\n${text}` }
  ], 500)
}

export async function generateSubjectLines(context) {
  return complete([
    { role: 'user', content: `Generate 5 email subject line options for this context. Return a numbered list only.\n\n${context}` }
  ], 300)
}

export async function buildAgenda(notes) {
  return complete([
    { role: 'user', content: `Build a structured meeting agenda from these notes. Use clear sections with time estimates.\n\n${notes}` }
  ], 500)
}

export async function summarizeNotes(notes) {
  return complete([
    { role: 'user', content: `Summarize these notes into key takeaways and action items. Be concise and structured.\n\n${notes}` }
  ], 500)
}

export async function expandIdea(idea) {
  return complete([
    { role: 'user', content: `Expand on this idea. Break it down into: what it is, who it's for, key features/steps, and potential challenges. Be concise but actionable.\n\n${idea}` }
  ], 600)
}

export async function focusAdvice(projects) {
  const summary = projects.map(p =>
    `- ${p.title} [${p.category}] priority:${p.priority} due:${p.dueDate || 'none'} status:${p.status}`
  ).join('\n')
  return complete([
    { role: 'user', content: `Here are my current projects. Tell me what I should focus on right now and why. Be direct and actionable.\n\n${summary}` }
  ], 400)
}

export async function draftEmail(prompt) {
  return complete([
    { role: 'user', content: `Draft a professional email based on this prompt. Return subject line + body only.\n\n${prompt}` }
  ], 500)
}
