'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import ProgressBar from '@/components/ProgressBar'
import StationCard from '@/components/StationCard'

interface Participant { id: string; firstName: string; lastName: string }
interface Station { id: string; stationLabel: string; stationCode: string; order: number; answered: boolean }
interface Progress { stations: Station[]; totalActive: number; isComplete: boolean }

export default function DashboardPage() {
  const router = useRouter()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const loadData = useCallback(async () => {
    const meRes = await fetch('/api/me')
    if (!meRes.ok) { router.replace('/register'); return }
    const me = await meRes.json()
    setParticipant(me)

    const progressRes = await fetch(`/api/participants/${me.id}/progress`)
    if (progressRes.ok) setProgress(await progressRes.json())
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const handleCodeSubmit = async () => {
    if (code.length !== 3) return
    setCodeLoading(true)
    setCodeError('')
    const res = await fetch('/api/stations/by-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/station/${data.stationId}`)
    } else {
      setCodeError('Code inconnu — vérifiez l\'affiche')
      setCodeLoading(false)
    }
  }

  const answeredCount = progress?.stations.filter((s) => s.answered).length ?? 0

  if (!participant || !progress) {
    return <div className="min-h-screen" style={{ background: 'var(--color-primary)' }} />
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <MobileHeader>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              BONJOUR
            </p>
            <p className="text-white text-[17px] font-medium">{participant.firstName} {participant.lastName}</p>
          </div>
          <div
            className="text-white text-[13px] font-medium px-3 py-1 rounded-[10px]"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            {answeredCount}/{progress.totalActive}
          </div>
        </div>
        <ProgressBar total={progress.totalActive} answered={answeredCount} />
      </MobileHeader>

      <div className="px-4 pt-4 pb-8">
        {/* Action zone */}
        {progress.isComplete ? (
          /* Bannière dorée */
          <div
            className="rounded-xl p-4 mb-5 flex items-center gap-3"
            style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}
          >
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="text-[14px] font-medium" style={{ color: 'var(--color-warning)' }}>
                Parcours complet !
              </p>
              <button
                onClick={() => router.push('/complete')}
                className="text-[13px] font-medium underline mt-0.5"
                style={{ color: 'var(--color-warning)' }}
              >
                Voir mon score →
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)' }}
          >
            {/* Bouton Scanner */}
            <button
              onClick={() => router.push('/scan')}
              className="w-full rounded-xl p-4 mb-4 flex items-center gap-3 text-left"
              style={{ background: 'var(--color-primary)' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.8" />
                  <rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.8" />
                  <rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.8" />
                  <rect x="15" y="15" width="2.5" height="2.5" fill="white" />
                  <rect x="19" y="15" width="2.5" height="2.5" fill="white" />
                  <rect x="15" y="19" width="2.5" height="2.5" fill="white" />
                  <rect x="19" y="19" width="2.5" height="2.5" fill="white" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-[15px] font-medium">QR Scanner la prochaine station ›</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {progress.totalActive - answeredCount} station{progress.totalActive - answeredCount > 1 ? 's' : ''} restante{progress.totalActive - answeredCount > 1 ? 's' : ''}
                </p>
              </div>
            </button>

            {/* Separator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-[1px]" style={{ background: 'var(--border-secondary)' }} />
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                ou entrez le code de la station
              </span>
              <div className="flex-1 h-[1px]" style={{ background: 'var(--border-secondary)' }} />
            </div>

            {/* Code input */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <input
                type="number"
                maxLength={3}
                value={code}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 3)
                  setCode(v)
                  setCodeError('')
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 3) handleCodeSubmit() }}
                placeholder="_ _ _"
                className="text-center text-[20px] font-bold outline-none rounded-[10px]"
                style={{
                  width: 80,
                  border: codeError ? '1.5px solid var(--color-danger)' : '1.5px solid var(--border-secondary)',
                  background: codeError ? 'var(--color-danger-bg)' : 'var(--bg-secondary)',
                  padding: '8px 0',
                }}
              />
              <button
                onClick={handleCodeSubmit}
                disabled={code.length !== 3 || codeLoading}
                className="px-4 py-2 rounded-[10px] text-[14px] font-medium text-white transition-all"
                style={{
                  background: 'var(--color-primary)',
                  opacity: code.length !== 3 || codeLoading ? 0.4 : 1,
                  cursor: code.length !== 3 || codeLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {codeLoading ? '…' : 'Accéder'}
              </button>
            </div>

            {codeError && (
              <p className="text-center text-[11px]" style={{ color: 'var(--color-danger)' }}>
                {codeError}
              </p>
            )}

            <p className="text-center text-[11px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Ou scannez avec l'appareil photo de votre téléphone
            </p>
          </div>
        )}

        {/* Stations list */}
        <p className="text-[11px] font-medium tracking-[0.04em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
          STATIONS DU PARCOURS
        </p>
        {progress.stations.map((s) => (
          <StationCard
            key={s.id}
            stationLabel={s.stationLabel}
            answered={s.answered}
            onClick={() => router.push(`/station/${s.id}`)}
          />
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-success)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Répondue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--bg-tertiary)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>À scanner</span>
          </div>
        </div>
      </div>
    </div>
  )
}
