import Anthropic from '@anthropic-ai/sdk'

const RECIPE_PROMPT = `You are extracting a recipe from an image. The image may be:
- A screenshot of an Instagram post or reel caption
- A screenshot of a recipe website
- A photo of a handwritten or printed recipe
- A food photo with recipe text overlaid

Extract any recipe information visible and return ONLY a valid JSON object with these fields (omit fields you can't find):
{
  "title": "Recipe name",
  "cuisine": "e.g. Italian, Thai, Mexican",
  "category": "e.g. Chicken, Beef, Pasta, Vegetarian, Seafood",
  "ingredients": [{"measure": "2 tbsp", "name": "olive oil"}, ...],
  "instructions": "Step 1: ...\n\nStep 2: ...",
  "tags": ["quick", "spicy"],
  "readyInMinutes": 30,
  "servings": 2
}

If you cannot identify any recipe content in the image, return {"error": "No recipe found"}.
Return ONLY valid JSON, no markdown fences, no extra text.`

export async function extractRecipeFromImage(imageBase64, mimeType, apiKey) {
  const client = new Anthropic({ apiKey })

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        { type: 'text', text: RECIPE_PROMPT },
      ],
    }],
  })

  const text = msg.content[0].text.trim()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    // Try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse recipe from image')
    data = JSON.parse(match[0])
  }

  if (data.error) throw new Error(data.error)

  return {
    id: `vision-${Date.now()}`,
    source: 'Instagram / Screenshot',
    ...data,
    ingredients: (data.ingredients || []).filter(i => i.name),
    tags: data.tags || [],
    sourceUrl: null,
    youtubeUrl: null,
    image: null,
  }
}
