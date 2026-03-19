'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface StationStat { stationLabel: string; stationCode: string; totalAnswers: number; correctAnswers: number; percentage: number }
interface SubsidiaryAnswer { id: string; answerText: string; answeredAt: string; participant: { firstName: string; lastName: string; email: string } }
interface Results { totalParticipants: number; completeCount: number; totalAnswers: number; totalActive: number; stationStats: StationStat[]; subsidiaryAnswers: SubsidiaryAnswer[] }

function getBarColor(pct: number) {
  if (pct >= 70) return '#639922'
  if (pct >= 40) return '#2E75B6'
  if (pct >= 20) return '#BA7517'
  return '#E24B4A'
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<Results | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/results')
    if (!res.ok) { router.replace('/admin/login'); return }
    setResults(await res.json())
  }, [router])

  useEffect(() => { load() }, [load])

  if (!results) return <div className="flex items-center justify-center h-full"><p style={{ color: '#888' }}>Chargement…</p></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[18px] font-bold">Résultats</h1>
        <button onClick={load} className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#fff', border: '1px solid #E0E0E0', color: '#555' }}>↻ Actualiser</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Participants inscrits', value: results.totalParticipants },
          { label: 'Parcours complets', value: `${results.completeCount} / ${results.totalParticipants}` },
          { label: 'Réponses subsidiaires', value: results.subsidiaryAnswers.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[10px] p-4" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
            <p className="text-[11px] font-medium tracking-wide mb-1" style={{ color: '#888' }}>{label.toUpperCase()}</p>
            <p className="text-[26px] font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Station stats table */}
      <div className="rounded-[10px] overflow-hidden mb-5" style={{ border: '1px solid #E0E0E0' }}>
        <div className="px-4 py-3" style={{ background: '#F5F5F5', borderBottom: '1px solid #E0E0E0' }}>
          <p className="text-[13px] font-semibold">Résultats par station</p>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              {['CODE', 'STATION', 'RÉPONSES', 'CORRECTES', 'SCORE', 'BARRE'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wide" style={{ color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.stationStats.map((s, i) => (
              <tr key={i} style={{ borderTop: '1px solid #F0F0F0' }}>
                <td className="px-4 py-3"><span className="text-[12px] font-bold px-2 py-0.5 rounded" style={{ background: '#E8F4FD', color: 'var(--color-secondary)' }}>{s.stationCode}</span></td>
                <td className="px-4 py-3 text-[13px] font-medium">{s.stationLabel}</td>
                <td className="px-4 py-3 text-[13px]">{s.totalAnswers}</td>
                <td className="px-4 py-3 text-[13px] font-medium" style={{ color: '#639922' }}>{s.correctAnswers}</td>
                <td className="px-4 py-3 text-[13px] font-bold" style={{ color: getBarColor(s.percentage) }}>{s.percentage}%</td>
                <td className="px-4 py-3" style={{ width: 120 }}>
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#F0F0F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, background: getBarColor(s.percentage) }} />
                  </div>
                </td>
              </tr>
            ))}
            {results.stationStats.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[13px]" style={{ color: '#aaa' }}>Aucune réponse pour l'instant</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Subsidiary answers */}
      <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid #E0E0E0' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#FAEEDA', borderBottom: '1px solid #FAC775' }}>
          <p className="text-[13px] font-semibold" style={{ color: '#633806' }}>⭐ Réponses subsidiaires ({results.subsidiaryAnswers.length})</p>
          <p className="text-[11px]" style={{ color: '#BA7517' }}>Ordre d'arrivée</p>
        </div>
        {results.subsidiaryAnswers.length === 0 ? (
          <div className="px-4 py-6 text-center text-[13px]" style={{ color: '#aaa' }}>Aucune réponse subsidiaire</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['#', 'PARTICIPANT', 'RÉPONSE', 'HEURE'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium tracking-wide" style={{ color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.subsidiaryAnswers.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid #F0F0F0', background: i === 0 ? 'rgba(186,117,23,0.05)' : '#fff' }}>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full" style={{ background: i === 0 ? '#BA7517' : '#F5F5F5', color: i === 0 ? 'white' : '#888', display: 'inline-flex' }}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-medium">{s.participant.firstName} {s.participant.lastName}</p>
                    <p className="text-[11px]" style={{ color: '#aaa' }}>{s.participant.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium">{s.answerText}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: '#888' }}>
                    {new Date(s.answeredAt).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
