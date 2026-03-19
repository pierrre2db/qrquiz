'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▣' },
  { href: '/admin/participants', label: 'Participants', icon: '👥' },
  { href: '/admin/questions', label: 'Questions QCM', icon: '❓' },
  { href: '/admin/qrcodes', label: 'QR Codes', icon: '⬛' },
  { href: '/admin/results', label: 'Résultats', icon: '📊' },
  { href: '/admin/welcome', label: 'Page de bienvenue', icon: '🖥' },
  { href: '/admin/manual', label: 'Manuel admin', icon: '📖' },
]

interface ResetModalProps {
  onClose: () => void
}

function ResetModal({ onClose }: ResetModalProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Erreur')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="rounded-2xl p-6 text-center" style={{ background: '#fff', width: 360, border: '1px solid #E0E0E0' }}>
          <div className="flex items-center justify-center rounded-[14px] mx-auto mb-4" style={{ width: 48, height: 48, background: '#EAF3DE', border: '1px solid #C0DD97' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12L9.5 16.5L19 7" stroke="#639922" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p className="text-[16px] font-semibold mb-1" style={{ color: '#1A1A1A' }}>Jeu réinitialisé</p>
          <p className="text-[13px] mb-4" style={{ color: '#888' }}>Tous les participants et réponses ont été supprimés.</p>
          <button onClick={() => { onClose(); router.refresh() }} className="w-full py-3 rounded-xl text-white text-[14px] font-medium" style={{ background: 'var(--color-primary)' }}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="rounded-2xl p-6" style={{ background: '#fff', width: 360, border: '1px solid #E0E0E0' }}>
        <div className="flex items-center justify-center rounded-[14px] mx-auto mb-4" style={{ width: 48, height: 48, background: '#FFEBEE', border: '1px solid #F09595' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v5M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
        <h3 className="text-[16px] font-bold text-center mb-1">Relancer le jeu</h3>
        <p className="text-[13px] text-center mb-4" style={{ color: '#555' }}>Cette action supprimera définitivement :</p>

        <div className="rounded-lg p-3 mb-3" style={{ background: '#F5F5F5', border: '1px solid #E0E0E0' }}>
          <p className="text-[12px] font-medium mb-1" style={{ color: '#E24B4A' }}>Supprimé</p>
          {['Tous les participants', 'Toutes les réponses', 'Les réponses subsidiaires', 'Fichiers CSV / JSON'].map(i => (
            <p key={i} className="text-[12px]" style={{ color: '#555' }}>• {i}</p>
          ))}
          <p className="text-[12px] font-medium mt-2 mb-1" style={{ color: '#639922' }}>Conservé</p>
          {['Questions et stations', 'QR codes générés', 'Paramètres du parcours'].map(i => (
            <p key={i} className="text-[12px]" style={{ color: '#555' }}>• {i}</p>
          ))}
        </div>

        <div className="rounded-lg p-3 mb-4 flex items-start gap-2" style={{ background: '#FFEBEE', border: '1px solid #F09595' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5"><path d="M8 6v4M8 11.5h.01M6.29 2.57L1.22 12a1.33 1.33 0 001.14 2h11.28a1.33 1.33 0 001.14-2L9.71 2.57a1.33 1.33 0 00-2.42 0z" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <p className="text-[11px]" style={{ color: '#E24B4A' }}>Action irréversible — les données seront définitivement perdues.</p>
        </div>

        <label className="block text-[11px] font-medium tracking-wide mb-1" style={{ color: '#555' }}>MOT DE PASSE ADMIN</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 rounded-lg text-[14px] outline-none mb-1"
          style={{ border: error ? '1.5px solid #E24B4A' : '1.5px solid #E0E0E0' }}
        />
        {error && <p className="text-[11px] mb-2" style={{ color: '#E24B4A' }}>{error}</p>}

        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ border: '1px solid #E0E0E0', color: '#555' }}>Annuler</button>
          <button
            onClick={handleReset}
            disabled={!password || loading}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-medium transition-all"
            style={{ background: '#E24B4A', opacity: !password || loading ? 0.4 : 1, cursor: !password || loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Réinitialisation…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showReset, setShowReset] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      <aside className="flex flex-col flex-shrink-0" style={{ width: 200, minHeight: '100vh', background: 'var(--color-primary)' }}>
        {/* Logo */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white font-bold text-[15px]">QR-QUIZ</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Administration</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV.map(({ href, label, icon }) => {
            const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid white' : '3px solid transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <span className="text-[14px]">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom buttons */}
        <div className="p-3 flex flex-col gap-2">
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-2 px-3 rounded-lg text-[12px] font-medium text-left flex items-center gap-2"
            style={{ background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.4)', color: '#E24B4A' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 1010 0A5 5 0 002 7zM7 5v3M7 9.5h.01" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Relancer le jeu
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg text-[12px] text-left"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            → Déconnexion
          </button>
        </div>
      </aside>

      {showReset && <ResetModal onClose={() => setShowReset(false)} />}
    </>
  )
}
