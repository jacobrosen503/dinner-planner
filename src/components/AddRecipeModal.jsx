import { useState, useEffect, useRef } from 'react'
import { scrapeUrl } from '../api/client'
import { computeTags } from '../utils/tags'
import { isEntree } from '../utils/entree'

const EMPTY_FORM = {
  title: '', cuisine: '', category: '', image: '', sourceUrl: '',
  instructions: '', tags: '', ingredients: '',
}

export default function AddRecipeModal({ onClose, onSave, onUseNow }) {
  const [mode, setMode] = useState('url')    // 'url' | 'instagram' | 'manual'
  const [url, setUrl] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [scraped, setScraped] = useState(null)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Instagram state
  const [igMode, setIgMode] = useState('screenshot') // 'screenshot' | 'url'
  const [igUrl, setIgUrl] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMime, setImageMime] = useState('image/jpeg')
  const fileRef = useRef(null)

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  // ── URL scraping ──────────────────────────────────────────────────────────

  const handleScrape = async (targetUrl) => {
    const u = (targetUrl || url).trim()
    if (!u) return
    setScraping(true); setError('')
    try {
      const recipe = await scrapeUrl(u)
      populateFromRecipe(recipe)
    } catch (e) {
      setError(e.message)
    } finally {
      setScraping(false)
    }
  }

  // ── Instagram ─────────────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageMime(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setImagePreview(dataUrl)
      // Strip the "data:image/...;base64," prefix
      setImageBase64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleVisionExtract = async () => {
    if (!imageBase64) return
    setScraping(true); setError('')
    try {
      const r = await fetch('/api/vision/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Vision extraction failed')
      populateFromRecipe(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setScraping(false)
    }
  }

  const handleIgUrl = async () => {
    if (!igUrl.trim()) return
    setScraping(true); setError('')
    try {
      const recipe = await scrapeUrl(igUrl.trim())
      populateFromRecipe(recipe)
    } catch {
      // Instagram blocks unauthenticated access — save the link as a stub recipe
      const stub = {
        id: `ig-link-${Date.now()}`,
        source: 'Instagram',
        title: 'Instagram Reel',
        sourceUrl: igUrl.trim(),
        image: null, cuisine: '', category: '', instructions: '',
        ingredients: [], tags: [],
      }
      populateFromRecipe(stub)
    } finally {
      setScraping(false)
    }
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  const populateFromRecipe = (recipe) => {
    setScraped(recipe)
    setForm({
      title: recipe.title || '',
      cuisine: recipe.cuisine || '',
      category: recipe.category || '',
      image: recipe.image || '',
      sourceUrl: recipe.sourceUrl || '',
      instructions: recipe.instructions || '',
      tags: (recipe.tags || []).join(', '),
      ingredients: (recipe.ingredients || []).map(i => `${i.measure} ${i.name}`.trim()).join('\n'),
    })
    setMode('manual') // jump to edit view
  }

  const buildRecipe = () => {
    const ingredients = form.ingredients
      .split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => {
        const m = l.match(/^([\d¼½¾⅓⅔⅛⅜⅝⅞\s\/\.]+(?:cup|tbsp|tsp|tablespoon|teaspoon|oz|lb|g|ml|can|bunch|clove|piece|slice|handful|pinch|dash)?s?\.?)\s+(.+)/i)
        return m ? { measure: m[1].trim(), name: m[2].trim() } : { measure: '', name: l }
      })
    return {
      ...(scraped || {}),
      title: form.title, cuisine: form.cuisine, category: form.category,
      image: form.image, sourceUrl: form.sourceUrl, instructions: form.instructions,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      ingredients,
      source: scraped?.source || 'User Added',
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    try { await onSave(buildRecipe()); onClose() }
    catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleUseNow = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    onUseNow(buildRecipe()); onClose()
  }

  const recipe = scraped ? buildRecipe() : null
  const tags = recipe ? computeTags(recipe) : []
  const entrée = recipe ? isEntree(recipe) : true
  const showEditFooter = mode === 'manual' && form.title

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl rounded-2xl flex flex-col overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <h2 className="text-lg font-bold text-white">Add Recipe</h2>
          <div className="flex items-center gap-1.5 flex-1">
            {['url', 'instagram', 'manual'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                style={{ background: mode === m ? '#2a2a2a' : 'transparent', color: mode === m ? '#fff' : '#555' }}
              >
                {m === 'url' ? '🔗 Paste URL' : m === 'instagram' ? '📸 Instagram' : '✏️ Manual'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-sm shrink-0" style={{ background: '#2a2a2a', color: '#aaa' }}>✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── URL mode ── */}
          {mode === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#aaa' }}>Recipe URL</label>
                <div className="flex gap-2">
                  <input value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScrape()}
                    placeholder="https://thewoksoflife.com/…"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#0f0f0f', border: '1px solid #333', color: '#fff' }}
                  />
                  <button onClick={() => handleScrape()} disabled={scraping || !url.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                    style={{ background: '#ff6b35', color: '#fff' }}>
                    {scraping ? '…' : 'Fetch'}
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: '#555' }}>
                  Works with Woks of Life, Serious Eats, Budget Bytes, Half Baked Harvest, Minimalist Baker, Food52, and most sites with structured recipe data.
                </p>
              </div>
            </div>
          )}

          {/* ── Instagram mode ── */}
          {mode === 'instagram' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                {['screenshot', 'url'].map(m => (
                  <button key={m} onClick={() => setIgMode(m)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: igMode === m ? '#2a2a2a' : '#141414', color: igMode === m ? '#fff' : '#555', border: `1px solid ${igMode === m ? '#444' : '#222'}` }}>
                    {m === 'screenshot' ? '📷 Upload Screenshot' : '🔗 Reel URL'}
                  </button>
                ))}
              </div>

              {igMode === 'screenshot' && (
                <div>
                  <p className="text-xs mb-3" style={{ color: '#666' }}>
                    Screenshot the recipe from the Instagram caption, story, or any slide — Claude will read it and extract the recipe automatically.
                  </p>

                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

                  {!imagePreview ? (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full py-10 rounded-xl flex flex-col items-center gap-2 cursor-pointer"
                      style={{ border: '2px dashed #333', color: '#555' }}>
                      <span className="text-3xl">📷</span>
                      <span className="text-sm">Tap to upload screenshot</span>
                      <span className="text-xs">JPG, PNG, HEIC</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 280 }}>
                        <img src={imagePreview} alt="Preview" className="w-full object-contain" style={{ maxHeight: 280 }} />
                        <button onClick={() => { setImagePreview(null); setImageBase64(null) }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
                          style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>✕</button>
                      </div>
                      <button onClick={handleVisionExtract} disabled={scraping}
                        className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
                        style={{ background: '#ff6b35', color: '#fff' }}>
                        {scraping ? '🤖 Reading recipe…' : '🤖 Extract Recipe with AI'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {igMode === 'url' && (
                <div>
                  <p className="text-xs mb-3" style={{ color: '#666' }}>
                    Instagram heavily restricts public access. This may work for some posts. If it fails, upload a screenshot instead.
                  </p>
                  <div className="flex gap-2">
                    <input value={igUrl} onChange={e => setIgUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleIgUrl()}
                      placeholder="https://www.instagram.com/reel/…"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: '#0f0f0f', border: '1px solid #333', color: '#fff' }}
                    />
                    <button onClick={handleIgUrl} disabled={scraping || !igUrl.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                      style={{ background: '#ff6b35', color: '#fff' }}>
                      {scraping ? '…' : 'Try'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Scraped recipe preview ── */}
          {scraped && mode !== 'manual' && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}>
              <div className="flex gap-3">
                {scraped.image && <img src={scraped.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                <div>
                  <div className="font-semibold text-white text-sm">{scraped.title}</div>
                  <div className="text-xs mt-1" style={{ color: '#555' }}>{scraped.source} · {scraped.cuisine || 'Unknown cuisine'}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: entrée ? '#ff6b3522' : '#fbbf2422', color: entrée ? '#ff6b35' : '#fbbf24' }}>
                      {entrée ? '✓ Entree' : 'Side Dish'}
                    </span>
                    {tags.map(t => (
                      <span key={t.label} className="px-2 py-0.5 rounded text-xs" style={{ background: `${t.color}22`, color: t.color }}>
                        {t.icon} {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Manual edit fields ── */}
          {mode === 'manual' && (
            <div className="space-y-3">
              {!scraped && <p className="text-xs" style={{ color: '#555' }}>Enter recipe details manually.</p>}
              <Field label="Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Thai Basil Chicken" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cuisine" value={form.cuisine} onChange={v => setForm(f => ({ ...f, cuisine: v }))} placeholder="e.g. Thai" />
                <Field label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} placeholder="e.g. Chicken" />
              </div>
              <Field label="Image URL" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} placeholder="https://…" />
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#aaa' }}>Ingredients (one per line)</label>
                <textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} rows={5}
                  placeholder={'2 tbsp soy sauce\n1 lb chicken thighs\n3 cloves garlic'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono"
                  style={{ background: '#0f0f0f', border: '1px solid #333', color: '#ccc' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#aaa' }}>Instructions</label>
                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={4}
                  placeholder="Step 1: …"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#0f0f0f', border: '1px solid #333', color: '#ccc' }} />
              </div>
              <Field label="Tags (comma separated)" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="quick, spicy, one-pot" />
            </div>
          )}

          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {/* Footer */}
        {showEditFooter && (
          <div className="px-6 py-4 flex gap-2 shrink-0" style={{ borderTop: '1px solid #2a2a2a' }}>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
              style={{ background: '#2a2a2a', color: '#ccc' }}>
              {saving ? 'Saving…' : '💾 Save to Library'}
            </button>
            <button onClick={handleUseNow} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
              style={{ background: '#ff6b35', color: '#fff' }}>
              📌 Use This Week
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#aaa' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#0f0f0f', border: '1px solid #333', color: '#fff' }} />
    </div>
  )
}
