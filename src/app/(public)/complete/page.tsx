'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'

interface Progress { totalActive: number; stations: { answered: boolean; answer: { isCorrect: boolean } | null }[] }

export default function CompletePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [subsidiaryQuestion, setSubsidiaryQuestion] = useState('')
  const [subsidiaryAnswer, setSubsidiaryAnswer] = useState('')
  const [subsidiarySubmitted, setSubsidiarySubmitted] = useState(false)
  const [subsidiaryLoading, setSubsidiaryLoading] = useState(false)
  const [participantId, setParticipantId] = useState('')

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/me')
      if (!meRes.ok) { router.replace('/register'); return }
      const me = await meRes.json()
      setFirstName(me.firstName)
      setParticipantId(me.id)

      const [progressRes, welcomeRes] = await Promise.all([
        fetch(`/api/participants/${me.id}/progress`),
        fetch('/api/public/welcome').catch(() => null),
      ])

      if (progressRes.ok) {
        const p = await progressRes.json()
        if (!p.isComplete) { router.replace('/dashboard'); return }
        setProgress(p)
      }

      const welcomeData = welcomeRes && welcomeRes.ok ? await welcomeRes.json() : null
      setSubsidiaryQuestion(
        welcomeData?.subsidiary_question || 'En quelle année a été fondé cet établissement ?'
      )
    }
    load()
  }, [router])

  const handleSubsidiarySubmit = async () => {
    if (!subsidiaryAnswer.trim()) return
    setSubsidiaryLoading(true)
    const res = await fetch('/api/subsidiary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerText: subsidiaryAnswer.trim() }),
    })
    if (res.ok || res.status === 409) setSubsidiarySubmitted(true)
    setSubsidiaryLoading(false)
  }

  const score = progress?.stations.filter((s) => s.answer?.isCorrect).length ?? 0
  const total = progress?.totalActive ?? 0
  const circumference = 2 * Math.PI * 45
  const arc = total > 0 ? (score / total) * circumference : 0

  if (!progress) return <div className="min-h-screen" style={{ background: 'var(--color-primary)' }} />

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)' }} className="px-5 pt-6 pb-6">
        {/* Badge */}
        <div className="flex justify-center mb-5">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-[20px]"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-white text-[11px] tracking-[0.05em] font-medium">PARCOURS COMPLET</span>
          </div>
        </div>

        {/* Score circle */}
        <div className="flex justify-center mb-4">
          <div className="relative" style={{ width: 110, height: 110 }}>
            <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle
                cx="55" cy="55" r="45" fill="none"
                stroke="white" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - arc}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-[26px] font-medium leading-none">{score} / {total}</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>réponses</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white text-[16px] font-medium">Bravo {firstName} !</p>
        <p className="text-center text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Toutes les stations complétées
        </p>

        {/* Progress bar 100% */}
        <div className="flex gap-[3px] mt-3">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="h-[5px] flex-1 rounded-sm" style={{ background: 'white' }} />
          ))}
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {total}/{total} stations
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-10" style={{ background: 'var(--bg-primary)' }}>
        {/* Recap icons */}
        <p className="text-[11px] tracking-[0.04em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
          RÉCAPITULATIF DES STATIONS
        </p>
        <div className="flex flex-wrap gap-[5px] mb-6 p-[14px] rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
          {progress.stations.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 30, height: 30,
                background: s.answer?.isCorrect ? 'var(--color-success)' : s.answer ? 'var(--color-danger)' : 'var(--bg-tertiary)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {s.answer?.isCorrect ? (
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                ) : s.answer ? (
                  <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <circle cx="7" cy="7" r="3" stroke="#888" strokeWidth="1.5" />
                )}
              </svg>
            </div>
          ))}
        </div>

        {/* Subsidiary question */}
        <div
          className="rounded-[14px] p-4"
          style={{ background: 'var(--color-warning-bg)', border: '1.5px solid var(--color-warning-border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 28, height: 28, background: 'var(--color-warning)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.5 5H13L9.5 7.5L11 11.5L7 9L3 11.5L4.5 7.5L1 5H5.5L7 1Z" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-medium tracking-[0.04em]" style={{ color: '#854F0B' }}>
                QUESTION SUBSIDIAIRE
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-warning)' }}>
                Départage en cas d'égalité
              </p>
            </div>
          </div>

          <p className="text-[14px] font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            {subsidiaryQuestion}
          </p>

          {subsidiarySubmitted ? (
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(186,117,23,0.1)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mx-auto mb-1">
                <path d="M4 10L8 14L16 6" stroke="#BA7517" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-warning)' }}>
                Réponse enregistrée !
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={subsidiaryAnswer}
                onChange={(e) => setSubsidiaryAnswer(e.target.value)}
                placeholder="Votre réponse…"
                rows={2}
                className="w-full rounded-[10px] px-3 py-2 text-[14px] outline-none resize-none mb-3"
                style={{
                  border: '1px solid var(--color-warning-border)',
                  background: 'var(--bg-primary)',
                }}
              />
              <button
                onClick={handleSubsidiarySubmit}
                disabled={!subsidiaryAnswer.trim() || subsidiaryLoading}
                className="w-full py-[10px] rounded-[10px] text-white text-[14px] font-medium transition-all"
                style={{
                  background: 'var(--color-warning)',
                  opacity: !subsidiaryAnswer.trim() || subsidiaryLoading ? 0.5 : 1,
                  cursor: !subsidiaryAnswer.trim() || subsidiaryLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {subsidiaryLoading ? 'Envoi…' : 'Envoyer ma réponse'}
              </button>
              <div className="flex items-center gap-1.5 mt-2 justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="var(--color-warning)" strokeWidth="1.5" />
                  <path d="M6 5V8" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="6" cy="3.5" r="0.75" fill="var(--color-warning)" />
                </svg>
                <p className="text-[11px]" style={{ color: 'var(--color-warning)' }}>
                  Une seule tentative autorisée
                </p>
              </div>
            </>
          )}
        </div>
        {/* Retour dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-4 py-3 rounded-[14px] text-[14px] font-medium flex items-center justify-center gap-2"
          style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--border-secondary)', color: 'var(--text-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Voir mon tableau de bord
        </button>
      </div>
    </div>
  )
}
