'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import ProgressBar from '@/components/ProgressBar'
import CTAButton from '@/components/CTAButton'

interface Station {
  id: string; stationLabel: string; stationCode: string
  question: string; optionA: string; optionB: string; optionC: string; optionD: string
  explanation: string | null; alreadyAnswered: boolean
  selectedOption: number | null; isCorrect: boolean | null
}
interface Progress { totalActive: number; stations: { answered: boolean }[] }

const OPTIONS = ['A', 'B', 'C', 'D']

export default function StationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [station, setStation] = useState<Station | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/me')
      if (!meRes.ok) { router.replace('/register'); return }
      const me = await meRes.json()
      setParticipantId(me.id)

      const [stationRes, progressRes] = await Promise.all([
        fetch(`/api/stations/${id}`),
        fetch(`/api/participants/${me.id}/progress`),
      ])

      if (!stationRes.ok) { router.replace('/dashboard'); return }
      const stationData = await stationRes.json()
      setStation(stationData)
      if (stationData.alreadyAnswered) setSelected(stationData.selectedOption)

      if (progressRes.ok) setProgress(await progressRes.json())
      setLoading(false)
    }
    load()
  }, [id, router])

  const handleSubmit = async () => {
    if (selected === null) return
    setSubmitting(true)
    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId: id, selectedOption: selected }),
    })
    if (res.ok) {
      const isLastStation = progress !== null && (answeredCount + 1 >= progress.totalActive)
      if (isLastStation) {
        window.location.replace('/complete')
      } else {
        router.push('/dashboard')
      }
    } else {
      setSubmitting(false)
    }
  }

  const answeredCount = progress?.stations.filter((s) => s.answered).length ?? 0
  const currentIndex = progress?.stations.findIndex((_, i) => {
    const s = progress.stations[i] as { id?: string } & typeof progress.stations[number]
    return true
  }) ?? 0

  const options = station ? [station.optionA, station.optionB, station.optionC, station.optionD] : []

  if (loading || !station) {
    return <div className="min-h-screen" style={{ background: 'var(--color-primary)' }} />
  }

  const isReadOnly = station.alreadyAnswered

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <MobileHeader>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-[11px] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {station.stationLabel.toUpperCase()}{isReadOnly ? ' — DÉJÀ RÉPONDUE' : ''}
            </p>
            <p className="text-white text-[14px] font-medium">
              Question {answeredCount + (isReadOnly ? 0 : 1)}/{progress?.totalActive ?? '?'}
            </p>
          </div>
        </div>
        {progress && <ProgressBar total={progress.totalActive} answered={isReadOnly ? answeredCount : answeredCount} />}
      </MobileHeader>

      <div className="px-4 pt-4 pb-8">
        {/* Read-only banner */}
        {isReadOnly && (
          <div
            className="flex items-center gap-2 rounded-[10px] px-3 py-2 mb-4"
            style={{ background: 'var(--color-success-bg)', border: '1px solid var(--border-secondary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 5" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] font-medium" style={{ color: '#3B6D11' }}>
              Question déjà répondue — consultation uniquement
            </span>
          </div>
        )}

        {/* Question block */}
        <div className="rounded-[14px] p-4 mb-4" style={{ background: 'var(--bg-secondary)' }}>
          <p className="text-[11px] tracking-[0.04em] mb-2" style={{ color: 'var(--text-tertiary)' }}>QUESTION</p>
          <p className="text-[15px] font-medium leading-[1.5]" style={{ color: 'var(--text-primary)' }}>
            {station.question}
          </p>
        </div>

        {/* Options */}
        <p className="text-[11px] tracking-[0.04em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
          {isReadOnly ? 'VOTRE RÉPONSE' : 'CHOISISSEZ UNE RÉPONSE'}
        </p>

        <div className="flex flex-col gap-2" style={{ opacity: isReadOnly ? 0.85 : 1 }}>
          {options.map((opt, i) => {
            const isSelected = selected === i
            const isOther = isReadOnly && !isSelected

            return (
              <button
                key={i}
                onClick={isReadOnly ? undefined : () => setSelected(i)}
                className="flex items-center gap-3 rounded-xl text-left transition-all duration-150"
                style={{
                  minHeight: 52,
                  padding: '13px 14px',
                  border: isSelected ? '2px solid var(--color-secondary)' : '1px solid var(--border-tertiary)',
                  background: isSelected ? '#E8F4FD' : isOther ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  cursor: isReadOnly ? 'default' : 'pointer',
                  pointerEvents: isReadOnly ? 'none' : 'auto',
                }}
              >
                {/* Letter circle */}
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0 text-[12px] font-bold"
                  style={{
                    width: 26, height: 26,
                    background: isSelected ? 'var(--color-secondary)' : 'var(--border-secondary)',
                    color: isSelected ? 'white' : 'var(--text-tertiary)',
                  }}
                >
                  {OPTIONS[i]}
                </div>

                <span
                  className="flex-1 text-[14px]"
                  style={{
                    color: isSelected ? '#185FA5' : isOther ? '#AAAAAA' : 'var(--text-primary)',
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {opt}
                </span>

                {isSelected && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9L7.5 12.5L14 6" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Explanation (read-only) */}
        {isReadOnly && station.explanation && (
          <div
            className="mt-4 rounded-xl p-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
          >
            <p className="text-[11px] tracking-[0.04em] mb-1" style={{ color: 'var(--text-tertiary)' }}>EXPLICATION</p>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{station.explanation}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-5">
          {isReadOnly ? (
            <CTAButton variant="outline" onClick={() => router.push('/dashboard')}>
              ≡ Retour au tableau de bord
            </CTAButton>
          ) : (
            <CTAButton onClick={handleSubmit} disabled={selected === null || submitting}>
              {submitting ? 'Validation…' : 'Valider ma réponse'}
            </CTAButton>
          )}
        </div>
      </div>
    </div>
  )
}
