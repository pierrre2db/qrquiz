'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Results {
  totalParticipants: number; completeCount: number; totalAnswers: number
  totalActive: number; stationStats: { stationLabel: string; totalAnswers: number; correctAnswers: number; percentage: number }[]
  subsidiaryAnswers: unknown[]
}
interface Participant { id: string; firstName: string; lastName: string; createdAt: string; answeredCount: number; totalActive: number }

function MetricCard({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-[10px] p-[14px]" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
      <p className="text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>{label}</p>
      <p className="text-[28px] font-bold leading-none" style={{ color: '#1A1A1A' }}>{value}</p>
      {note && <p className="text-[11px] mt-1" style={{ color: '#aaa' }}>{note}</p>}
    </div>
  )
}

function getBarColor(pct: number) {
  if (pct >= 70) return '#639922'
  if (pct >= 40) return '#2E75B6'
  if (pct >= 20) return '#BA7517'
  return '#E24B4A'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [results, setResults] = useState<Results | null>(null)
  const [recent, setRecent] = useState<Participant[]>([])

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([fetch('/api/admin/results'), fetch('/api/admin/participants?limit=5')])
    if (!r.ok) { router.replace('/admin/login'); return }
    setResults(await r.json())
    if (p.ok) setRecent((await p.json()).participants.slice(0, 5))
  }, [router])

  useEffect(() => { load() }, [load])

  if (!results) return <div className="flex items-center justify-center h-full"><p style={{ color: '#888' }}>Chargement…</p></div>

  const incompleteCount = results.totalParticipants - results.completeCount
  const avgScore = results.stationStats.length
    ? Math.round(results.stationStats.reduce((s, st) => s + st.percentage, 0) / results.stationStats.length)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold">Dashboard</h1>
          <p className="text-[12px]" style={{ color: '#888' }}>
            {new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: '#EAF3DE', border: '1px solid #C0DD97' }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#639922' }} />
          <span className="text-[12px] font-medium" style={{ color: '#3B6D11' }}>Concours actif</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-[10px] mb-5">
        <MetricCard label="INSCRITS" value={results.totalParticipants} note="participants" />
        <MetricCard label="COMPLETS" value={results.completeCount} note={`${incompleteCount} en cours`} />
        <MetricCard label="RÉPONSES TOTALES" value={results.totalAnswers} />
        <MetricCard label="STATIONS ACTIVES" value={results.totalActive} note={`score moy. ${avgScore}%`} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Station progress */}
        <div className="rounded-[10px] p-4" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          <p className="text-[13px] font-semibold mb-3">Avancement par station</p>
          {results.stationStats.map((s, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[11px]" style={{ color: '#555' }}>{s.stationLabel}</span>
                <span className="text-[11px] font-medium" style={{ color: '#555' }}>{s.totalAnswers} rép. · {s.percentage}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#F0F0F0' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${s.percentage}%`, background: getBarColor(s.percentage) }} />
              </div>
            </div>
          ))}
          {results.stationStats.length === 0 && <p className="text-[12px]" style={{ color: '#aaa' }}>Aucune réponse pour l'instant</p>}
        </div>

        {/* Recent participants */}
        <div className="rounded-[10px] p-4" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          <p className="text-[13px] font-semibold mb-3">Derniers inscrits</p>
          {recent.map((p) => {
            const initials = `${p.firstName[0]}${p.lastName[0]}`.toUpperCase()
            const progress = p.totalActive > 0 ? Math.round((p.answeredCount / p.totalActive) * 100) : 0
            const elapsed = Math.round((Date.now() - new Date(p.createdAt).getTime()) / 60000)
            return (
              <div key={p.id} className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center rounded-full text-white text-[11px] font-bold flex-shrink-0"
                  style={{ width: 28, height: 28, background: 'var(--color-secondary)' }}>{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate">{p.firstName} {p.lastName}</p>
                  <p className="text-[10px]" style={{ color: '#aaa' }}>il y a {elapsed < 60 ? `${elapsed}min` : `${Math.round(elapsed / 60)}h`}</p>
                </div>
                <div className="flex gap-[3px]">
                  {Array.from({ length: p.totalActive }).map((_, i) => (
                    <div key={i} className="rounded-sm" style={{ width: 8, height: 8, background: i < p.answeredCount ? '#639922' : '#E0E0E0' }} />
                  ))}
                </div>
              </div>
            )
          })}
          {recent.length === 0 && <p className="text-[12px]" style={{ color: '#aaa' }}>Aucun participant inscrit</p>}
        </div>
      </div>
    </div>
  )
}
