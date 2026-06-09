import Anthropic from '@anthropic-ai/sdk'

export async function generateAIRecipe({ cuisine, protein, tags = [] }) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured')

  const client = new Anthropic({ apiKey: key })

  const proteinPhrase = protein && protein !== 'Any' ? ` featuring ${protein.toLowerCase()}` : ''
  const tagParts = []
  if (tags.includes('quick')) tagParts.push('ready in under 30 minutes')
  if (tags.includes('onePot')) tagParts.push('cooked in one pot or pan')
  if (tags.includes('highProtein')) tagParts.push('high in protein')
  const tagPhrase = tagParts.length ? ` The dish should be ${tagParts.join(' and ')}.` : ''

  const prompt = `Generate a detailed, authentic ${cuisine} dinner recipe${proteinPhrase}.${tagPhrase}

Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object:
{
  "title": "Recipe Name",
  "cuisine": "${cuisine}",
  "category": "protein category (Beef/Chicken/Pork/Lamb/Seafood/Vegetarian/etc.)",
  "readyInMinutes": 40,
  "servings": 4,
  "ingredients": [
    {"name": "ingredient name", "measure": "quantity and unit"}
  ],
  "instructions": "Full step-by-step instructions. Separate each step with a newline."
}

Rules:
- Must be a complete dinner entree (not a side dish, appetizer, or dessert)
- Include 6–14 ingredients with realistic quantities
- 4–8 clear, detailed instruction steps separated by newlines
- readyInMinutes must be realistic (20–90)
- Authentic ${cuisine} cuisine — use traditional flavors, techniques, and ingredients`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].text.trim()
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim()
  const json = JSON.parse(clean)

  return {
    id: `ai-${cuisine.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    source: 'AI Generated',
    aiGenerated: true,
    title: json.title || `${cuisine} ${protein || ''} Dish`.trim(),
    image: null,
    category: json.category || protein || 'Miscellaneous',
    cuisine: json.cuisine || cuisine,
    instructions: json.instructions || '',
    ingredients: (json.ingredients || []).map(i => ({ name: String(i.name || ''), measure: String(i.measure || '') })),
    sourceUrl: null,
    youtubeUrl: null,
    tags: [],
    readyInMinutes: typeof json.readyInMinutes === 'number' ? json.readyInMinutes : null,
    servings: typeof json.servings === 'number' ? json.servings : null,
  }
}
