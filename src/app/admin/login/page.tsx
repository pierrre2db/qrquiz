'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => { if (r.ok) router.replace('/admin') })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Identifiants invalides')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F2F5' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center rounded-2xl mb-3" style={{ width: 56, height: 56, background: 'var(--color-primary)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="2" />
              <rect x="16" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="2" />
              <rect x="2" y="16" width="10" height="10" rx="2" stroke="white" strokeWidth="2" />
              <rect x="17" y="17" width="3" height="3" fill="white" /><rect x="22" y="17" width="3" height="3" fill="white" />
              <rect x="17" y="22" width="3" height="3" fill="white" /><rect x="22" y="22" width="3" height="3" fill="white" />
            </svg>
          </div>
          <h1 className="text-[20px] font-bold">QR-QUIZ</h1>
          <p className="text-[13px]" style={{ color: '#888' }}>Espace Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          <div className="mb-4">
            <label className="block text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>IDENTIFIANT</label>
            <input
              type="email" value={login} onChange={e => setLogin(e.target.value)}
              placeholder="admin@qrquiz.be" autoComplete="username"
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none"
              style={{ border: '1.5px solid #E0E0E0', background: '#F5F5F5' }}
            />
          </div>
          <div className="mb-5">
            <label className="block text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>MOT DE PASSE</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none pr-10"
                style={{ border: '1.5px solid #E0E0E0', background: '#F5F5F5' }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#aaa', lineHeight: 0 }}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-[12px] text-center mb-3" style={{ color: '#E24B4A' }}>{error}</p>}
          <button
            type="submit" disabled={!login || !password || loading}
            className="w-full py-3 rounded-xl text-white text-[14px] font-medium transition-all"
            style={{ background: 'var(--color-primary)', opacity: !login || !password || loading ? 0.5 : 1 }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
