'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminWelcomePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    if (!res.ok) { router.replace('/admin/login'); return }
    const data = await res.json()
    const origin = window.location.origin
    setBaseUrl(origin)
    setTitle(data.welcome_title || 'Bienvenue !')
    setText(data.welcome_text || 'Scannez le QR code ci-dessous pour démarrer le jeu.')
    setUrl(data.welcome_url || `${origin}/register`)
  }, [router])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ welcome_title: title, welcome_text: text, welcome_url: url }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const previewUrl = `/welcome`

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold">Page de bienvenue</h1>
          <p className="text-[12px]" style={{ color: '#888' }}>Affiché sur l'écran d'accueil de l'événement</p>
        </div>
        <div className="flex gap-2">
          <a href={previewUrl} target="_blank"
            className="px-3 py-2 rounded-lg text-[12px] font-medium"
            style={{ background: '#fff', border: '1px solid #E0E0E0', color: '#555' }}>
            👁 Aperçu
          </a>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-white"
            style={{ background: 'var(--color-primary)', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="rounded-xl p-5 mb-5" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
        <div className="mb-4">
          <label className="block text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>
            TITRE PRINCIPAL
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Bienvenue !"
            className="w-full px-3 py-2.5 rounded-lg text-[15px] font-bold outline-none"
            style={{ border: '1.5px solid #E0E0E0' }}
          />
          <p className="text-[11px] mt-1" style={{ color: '#aaa' }}>Affiché en très grand sur l'écran</p>
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>
            TEXTE DE DESCRIPTION
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder={"Scannez le QR code ci-dessous pour vous inscrire et démarrer le parcours.\nRépondez aux questions de chaque station pour gagner."}
            className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none resize-none"
            style={{ border: '1.5px solid #E0E0E0' }}
          />
          <p className="text-[11px] mt-1" style={{ color: '#aaa' }}>2–3 phrases. Retour à la ligne avec Entrée.</p>
        </div>

        <div className="mb-2">
          <label className="block text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>
            URL DU JEU (affiché sous le QR code)
          </label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={`${baseUrl}/register`}
            className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
            style={{ border: '1.5px solid #E0E0E0', fontFamily: 'monospace' }}
          />
          <p className="text-[11px] mt-1" style={{ color: '#aaa' }}>Cette URL est aussi encodée dans le QR code.</p>
        </div>
      </div>

      {/* Mini aperçu */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E0E0E0' }}>
        <div className="px-4 py-3" style={{ background: '#F5F5F5', borderBottom: '1px solid #E0E0E0' }}>
          <p className="text-[13px] font-semibold">Aperçu</p>
        </div>
        <div className="p-5 flex flex-col items-center text-center"
          style={{ background: 'linear-gradient(160deg, #0F2340 0%, #1E3A5F 60%, #1A4F8A 100%)', minHeight: 320 }}>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 12px', maxWidth: 480 }}>
            {title || 'Bienvenue !'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, maxWidth: 400, lineHeight: 1.6, margin: '0 0 24px', whiteSpace: 'pre-line' }}>
            {text || 'Scannez le QR code ci-dessous pour démarrer le jeu.'}
          </p>
          {url && (
            <div style={{ background: 'white', borderRadius: 16, padding: 12, marginBottom: 16 }}>
              <img
                src={`/api/public/qrcode?url=${encodeURIComponent(url)}`}
                alt="QR Code preview"
                style={{ width: 140, height: 140, display: 'block' }}
              />
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '8px 20px' }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{url || `${baseUrl}/register`}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
