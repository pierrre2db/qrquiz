'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface WelcomeSettings { welcome_title: string; welcome_text: string; welcome_url: string }
interface ScoreEntry { firstName: string; lastName: string; score: number; total: number; pct: number; completedAt: string }
interface Scoreboard { totalParticipants: number; completeCount: number; inWindow: number; totalActive: number; scoreboard: ScoreEntry[] }
interface RecentEntry { firstName: string; lastName: string; registeredAt: string }
interface Registrations { total: number; recent: RecentEntry[] }

const DEFAULTS: WelcomeSettings = {
  welcome_title: 'Bienvenue !',
  welcome_text: 'Scannez le QR code ci-dessous pour démarrer le jeu.',
  welcome_url: '',
}
const SCOREBOARD_MS = 15000
const REGISTRATIONS_MS = 3000
const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16', '#F97316']

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(first: string, last: string) { return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() }
function scoreColor(pct: number) { return pct >= 80 ? '#4ADE80' : pct >= 50 ? '#FCD34D' : '#F87171' }
function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}
function regKey(e: RecentEntry) { return `${e.firstName}|${e.lastName}|${e.registeredAt}` }
function scoreKey(e: ScoreEntry) { return `${e.firstName}|${e.lastName}` }

export default function WelcomePage() {
  const [settings, setSettings] = useState<WelcomeSettings>(DEFAULTS)
  const [baseUrl, setBaseUrl] = useState('')
  const [board, setBoard] = useState<Scoreboard | null>(null)
  const [registrations, setRegistrations] = useState<Registrations | null>(null)
  const [scoreProgress, setScoreProgress] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [newScoreKeys, setNewScoreKeys] = useState<Set<string>>(new Set())
  const [newRegKey, setNewRegKey] = useState<string | null>(null)

  const prevScoreKeysRef = useRef<Set<string>>(new Set())
  const prevRegTotalRef = useRef<number>(-1)
  const prevRegKeysRef = useRef<Set<string>>(new Set())
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const regIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/public/scoreboard', { cache: 'no-store' })
      if (res.ok) {
        const data: Scoreboard = await res.json()
        const keys = new Set(data.scoreboard.map(scoreKey))
        const fresh = new Set(Array.from(keys).filter(k => !prevScoreKeysRef.current.has(k)))
        if (fresh.size > 0) {
          setNewScoreKeys(fresh)
          setTimeout(() => setNewScoreKeys(new Set()), 3000)
        }
        prevScoreKeysRef.current = keys
        setBoard(data)
      }
    } catch { /* ignore */ }
    setLastRefresh(new Date())
    setScoreProgress(0)
  }, [])

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch('/api/public/registrations', { cache: 'no-store' })
      if (res.ok) {
        const data: Registrations = await res.json()
        const keys = new Set(data.recent.map(regKey))
        const freshKeys = Array.from(keys).filter(k => !prevRegKeysRef.current.has(k))
        if (freshKeys.length > 0 && prevRegKeysRef.current.size > 0) {
          setNewRegKey(freshKeys[0])
          setTimeout(() => setNewRegKey(null), 2000)
        }
        prevRegKeysRef.current = keys
        if (prevRegTotalRef.current >= 0 && data.total > prevRegTotalRef.current) {
          fetchBoard()
        }
        prevRegTotalRef.current = data.total
        setRegistrations(data)
      }
    } catch { /* ignore */ }
  }, [fetchBoard])

  useEffect(() => {
    const origin = window.location.origin
    setBaseUrl(origin)
    fetch('/api/public/welcome')
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => setSettings({
        welcome_title: data.welcome_title || DEFAULTS.welcome_title,
        welcome_text: data.welcome_text || DEFAULTS.welcome_text,
        welcome_url: data.welcome_url || `${origin}/register`,
      }))
      .catch(() => setSettings({ ...DEFAULTS, welcome_url: `${origin}/register` }))

    fetchBoard()
    fetchRegistrations()
    scoreIntervalRef.current = setInterval(fetchBoard, SCOREBOARD_MS)
    regIntervalRef.current = setInterval(fetchRegistrations, REGISTRATIONS_MS)
    const tick = 150
    progressIntervalRef.current = setInterval(
      () => setScoreProgress(p => Math.min(100, p + (tick / SCOREBOARD_MS) * 100)),
      tick
    )
    return () => {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current)
      if (regIntervalRef.current) clearInterval(regIntervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [fetchBoard, fetchRegistrations])

  const registerUrl = settings.welcome_url || `${baseUrl}/register`
  const qrUrl = `/api/public/qrcode?url=${encodeURIComponent(registerUrl)}`
  const top3 = board?.scoreboard.slice(0, 3) ?? []
  const rest = board?.scoreboard.slice(3) ?? []
  const inProgress = board ? board.totalParticipants - board.completeCount : 0
  const isFallback = board ? board.inWindow === 0 && board.completeCount > 0 : false

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: 'linear-gradient(160deg, #0B1D35 0%, #1A3560 60%, #1A4F8A 100%)', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Colonne gauche ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="2" stroke="white" strokeWidth="2" />
              <rect x="17" y="2" width="11" height="11" rx="2" stroke="white" strokeWidth="2" />
              <rect x="2" y="17" width="11" height="11" rx="2" stroke="white" strokeWidth="2" />
              <rect x="18" y="18" width="3" height="3" fill="white" />
              <rect x="24" y="18" width="3" height="3" fill="white" />
              <rect x="18" y="24" width="3" height="3" fill="white" />
              <rect x="24" y="24" width="3" height="3" fill="white" />
            </svg>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, fontWeight: 700, letterSpacing: '0.12em' }}>QR-QUIZ</span>
        </div>

        <h1 style={{ color: 'white', fontSize: 'clamp(28px, 4vw, 58px)', fontWeight: 800, textAlign: 'center', margin: '0 0 16px', lineHeight: 1.2, textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}>
          {settings.welcome_title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(14px, 1.8vw, 22px)', textAlign: 'center', maxWidth: 500, lineHeight: 1.6, margin: '0 0 36px', whiteSpace: 'pre-line' }}>
          {settings.welcome_text}
        </p>

        <div style={{ background: 'white', borderRadius: 24, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', marginBottom: 24 }}>
          {registerUrl && <img src={qrUrl} alt="QR Code" style={{ width: 'clamp(180px, 20vw, 300px)', height: 'clamp(180px, 20vw, 300px)', display: 'block' }} />}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '10px 24px' }}>
          <p style={{ color: 'white', fontSize: 'clamp(12px, 1.4vw, 18px)', fontWeight: 600, margin: 0, letterSpacing: '0.02em', textAlign: 'center' }}>
            {registerUrl}
          </p>
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div style={{ width: 'clamp(340px, 42vw, 580px)', display: 'flex', flexDirection: 'column', padding: '24px 22px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>

        {/* ── INSCRIPTIONS ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>Inscriptions</span>
            {registrations && (
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                {registrations.total} au total
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>3s</span>
            </div>
          </div>

          {/* Ticker */}
          <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!registrations ? (
              <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : registrations.recent.length === 0 ? (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>En attente des premiers inscrits…</span>
              </div>
            ) : (
              registrations.recent.map((entry, i) => {
                const key = regKey(entry)
                const isNew = key === newRegKey
                const color = avatarColor(entry.firstName + entry.lastName)
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: isNew ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isNew ? 'rgba(52,211,153,0.45)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 10, padding: '8px 12px',
                      animation: isNew ? 'tickerIn 0.4s cubic-bezier(0.22,1,0.36,1)' : undefined,
                      transition: 'background 0.6s ease, border-color 0.6s ease',
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>{initials(entry.firstName, entry.lastName)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: isNew ? '#6EE7B7' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, transition: 'color 0.6s ease' }}>
                        {entry.firstName} {entry.lastName}
                      </span>
                      {i === 0 && isNew && (
                        <span style={{ marginLeft: 8, background: '#10B981', color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 5, letterSpacing: '0.06em' }}>NOUVEAU</span>
                      )}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                      {new Date(entry.registeredAt).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* ── CLASSEMENT EN DIRECT ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>Classement en direct</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.45)', borderRadius: 20, padding: '2px 8px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite' }} />
                <span style={{ color: '#FCA5A5', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>LIVE</span>
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
              {isFallback ? 'Meilleurs scores — session précédente' : 'Provisoire · départage subsidiaire à venir'}
            </span>
          </div>
          {board && (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, paddingTop: 2 }}>
              {inProgress > 0 ? `${inProgress} en cours` : ''}
              {inProgress > 0 && board.completeCount > 0 ? ' · ' : ''}
              {board.completeCount > 0 ? `${board.completeCount} terminé${board.completeCount > 1 ? 's' : ''}` : ''}
            </span>
          )}
        </div>

        {/* Barre refresh */}
        <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 1, background: 'rgba(255,255,255,0.2)', width: `${scoreProgress}%`, transition: 'width 0.15s linear' }} />
        </div>

        {/* Liste scores */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {!board ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : board.scoreboard.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 40 }}>🏆</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', margin: 0 }}>Le classement apparaîtra dès qu&apos;un joueur aura terminé</p>
            </div>
          ) : (
            <>
              {/* Top 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 4 }}>
                {top3.map((entry, i) => {
                  const key = scoreKey(entry)
                  const isNew = newScoreKeys.has(key)
                  const RANK = [
                    { bg: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))', border: 'rgba(251,191,36,0.4)', accent: '#FBBF24', medal: '🥇', size: 20 },
                    { bg: 'linear-gradient(135deg, rgba(209,213,219,0.13), rgba(156,163,175,0.05))', border: 'rgba(209,213,219,0.25)', accent: '#D1D5DB', medal: '🥈', size: 17 },
                    { bg: 'linear-gradient(135deg, rgba(205,124,47,0.13), rgba(180,100,30,0.05))', border: 'rgba(205,124,47,0.25)', accent: '#CD7C2F', medal: '🥉', size: 16 },
                  ][i]
                  const color = avatarColor(entry.firstName + entry.lastName)
                  return (
                    <div key={key} style={{
                      background: isNew ? 'rgba(99,102,241,0.2)' : RANK.bg,
                      border: `1.5px solid ${isNew ? 'rgba(99,102,241,0.6)' : RANK.border}`,
                      borderRadius: 12, padding: '10px 12px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      animation: isNew ? 'tickerIn 0.4s cubic-bezier(0.22,1,0.36,1)' : undefined,
                    }}>
                      <span style={{ fontSize: RANK.size, flexShrink: 0, width: 24, textAlign: 'center' }}>{RANK.medal}</span>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${RANK.accent}40` }}>
                        <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>{initials(entry.firstName, entry.lastName)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ color: 'white', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.firstName} {entry.lastName}
                          </span>
                          {isNew && <span style={{ background: '#6366F1', color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>NOUVEAU</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: scoreColor(entry.pct), width: `${entry.pct}%`, transition: 'width 0.8s ease' }} />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, flexShrink: 0 }}>{formatTime(entry.completedAt)}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ color: scoreColor(entry.pct), fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{entry.pct}%</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 }}>{entry.score}/{entry.total}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {rest.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 9, letterSpacing: '0.08em' }}>SUITE</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {rest.map((entry, j) => {
                  const i = j + 3
                  const key = scoreKey(entry)
                  const isNew = newScoreKeys.has(key)
                  const color = avatarColor(entry.firstName + entry.lastName)
                  return (
                    <div key={key} style={{
                      background: isNew ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isNew ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 9, padding: '7px 10px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      animation: isNew ? 'tickerIn 0.4s cubic-bezier(0.22,1,0.36,1)' : undefined,
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, width: 20, textAlign: 'center', flexShrink: 0 }}>#{i + 1}</span>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>{initials(entry.firstName, entry.lastName)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.firstName} {entry.lastName}
                          </span>
                          {isNew && <span style={{ background: '#6366F1', color: 'white', fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>NEW</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: scoreColor(entry.pct), width: `${entry.pct}%`, transition: 'width 0.8s ease' }} />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, flexShrink: 0 }}>{formatTime(entry.completedAt)}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{ color: scoreColor(entry.pct), fontSize: 13, fontWeight: 700 }}>{entry.pct}%</span>
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{entry.score}/{entry.total}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {lastRefresh && (
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, textAlign: 'center', margin: '12px 0 0' }}>
            Classement mis à jour à {lastRefresh.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · inscrits 3s · classement 15s
          </p>
        )}
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes tickerIn {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
