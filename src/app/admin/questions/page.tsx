'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string; stationLabel: string; stationCode: string; order: number; isActive: boolean
  question: string; optionA: string; optionB: string; optionC: string; optionD: string
  correctAnswer: number; explanation: string | null
}
interface Settings { max_questions_limit: string; subsidiary_question?: string }

const EMPTY_FORM = { stationLabel: '', stationCode: '', question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 0, explanation: '', isActive: true }

export default function QuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [settings, setSettings] = useState<Settings>({ max_questions_limit: '20' })
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [localMaxLimit, setLocalMaxLimit] = useState(20)
  const [subsidiaryQuestion, setSubsidiaryQuestion] = useState('')
  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null)
  const [forceDeleteCount, setForceDeleteCount] = useState(0)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const load = useCallback(async () => {
    const [qRes, sRes] = await Promise.all([fetch('/api/admin/questions'), fetch('/api/admin/settings')])
    if (!qRes.ok) { router.replace('/admin/login'); return }
    const q = await qRes.json(); setQuestions(q)
    if (sRes.ok) {
      const s = await sRes.json(); setSettings(s)
      setLocalMaxLimit(parseInt(s.max_questions_limit ?? '20'))
      setSubsidiaryQuestion(s.subsidiary_question ?? '')
    }
  }, [router])

  useEffect(() => { load() }, [load])

  const saveSettings = async () => {
    setSettingsSaving(true)
    await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ max_questions_limit: String(localMaxLimit), subsidiary_question: subsidiaryQuestion }) })
    await load(); setSettingsSaving(false)
  }

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true) }
  const openEdit = (q: Question) => {
    setEditId(q.id)
    setForm({ stationLabel: q.stationLabel, stationCode: q.stationCode, question: q.question, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, correctAnswer: q.correctAnswer, explanation: q.explanation ?? '', isActive: q.isActive })
    setFormError(''); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.stationLabel || !form.stationCode || !form.question || !form.optionA || !form.optionB || !form.optionC || !form.optionD) { setFormError('Tous les champs obligatoires doivent être remplis'); return }
    if (!/^\d{3}$/.test(form.stationCode)) { setFormError('Le code station doit être exactement 3 chiffres'); return }
    setSaving(true); setFormError('')
    const url = editId ? `/api/admin/questions/${editId}` : '/api/admin/questions'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setShowModal(false); await load() }
    else { const d = await res.json(); setFormError(d.error || 'Erreur'); }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette station ?')) return
    const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    if (res.ok) { load(); return }
    const d = await res.json()
    if (res.status === 409 && d.answersCount) {
      setForceDeleteId(id)
      setForceDeleteCount(d.answersCount)
    }
  }

  const handleForceDelete = async () => {
    if (!forceDeleteId) return
    const res = await fetch(`/api/admin/questions/${forceDeleteId}?force=true`, { method: 'DELETE' })
    setForceDeleteId(null)
    if (res.ok) load()
  }

  const handleDrop = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return
    const reordered = [...questions]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    const withOrder = reordered.map((q, i) => ({ ...q, order: i + 1 }))
    setQuestions(withOrder)
    await fetch('/api/admin/questions/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: withOrder.map(q => ({ id: q.id, order: q.order })) }) })
    dragItem.current = null; dragOver.current = null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold">Questions QCM</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--color-primary)' }}>
          + Nouvelle station
        </button>
      </div>

      {/* Settings block */}
      <div className="rounded-xl p-4 mb-5" style={{ background: '#FAEEDA', border: '1.5px solid #FAC775' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[16px]">⚙️</span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: '#633806' }}>Paramètres du parcours</p>
              <p className="text-[11px]" style={{ color: '#BA7517' }}>{questions.length} / {localMaxLimit} stations créées</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: '#854F0B' }}>Max :</span>
            <button onClick={() => setLocalMaxLimit(m => Math.max(questions.length, m - 1))}
              className="flex items-center justify-center rounded-md text-[16px] font-bold" style={{ width: 28, height: 28, background: '#FAEEDA', border: '1px solid #FAC775', color: '#BA7517' }}>−</button>
            <input type="number" value={localMaxLimit}
              onChange={e => setLocalMaxLimit(Math.max(questions.length, parseInt(e.target.value) || 1))}
              className="text-center text-[15px] font-bold rounded-md outline-none"
              style={{ width: 50, border: '1.5px solid #BA7517', color: '#633806', padding: '2px 0' }} />
            <button onClick={() => setLocalMaxLimit(m => Math.min(100, m + 1))}
              className="flex items-center justify-center rounded-md text-[16px] font-bold" style={{ width: 28, height: 28, background: '#FAEEDA', border: '1px solid #FAC775', color: '#BA7517' }}>+</button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #FAC775', paddingTop: 12 }}>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#854F0B' }}>⭐ QUESTION SUBSIDIAIRE</label>
          <div className="flex gap-2">
            <input
              value={subsidiaryQuestion}
              onChange={e => setSubsidiaryQuestion(e.target.value)}
              placeholder="Ex : En quelle année a été fondé cet établissement ?"
              className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ border: '1.5px solid #FAC775', background: 'rgba(255,255,255,0.7)', color: '#1A1A1A' }}
            />
            <button onClick={saveSettings} disabled={settingsSaving} className="px-3 py-2 rounded-lg text-[12px] font-medium text-white flex-shrink-0" style={{ background: '#BA7517', opacity: settingsSaving ? 0.6 : 1 }}>
              {settingsSaving ? '…' : 'Enregistrer'}
            </button>
          </div>
          <p className="text-[10px] mt-1" style={{ color: '#BA7517' }}>Posée aux joueurs après qu'ils aient complété toutes les stations, pour départager les ex-aequo.</p>
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-2">
        {questions.map((q, idx) => {
          return (
            <div key={q.id}
              draggable onDragStart={() => { dragItem.current = idx }} onDragEnter={() => { dragOver.current = idx }} onDragEnd={handleDrop} onDragOver={e => e.preventDefault()}
              className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 cursor-grab active:cursor-grabbing"
              style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
              {/* Drag handle */}
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="flex-shrink-0" style={{ color: '#aaa' }}>
                {[2, 6, 10].map(y => [2, 7].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="#aaa" />))}
              </svg>
              {/* Order badge */}
              <div className="flex items-center justify-center rounded-md text-[11px] font-bold flex-shrink-0" style={{ width: 24, height: 24, background: '#D6E4F0', color: 'var(--color-primary)' }}>{idx + 1}</div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate">[{q.stationCode}] {q.stationLabel}</p>
                <p className="text-[11px] truncate" style={{ color: '#888' }}>{q.question}</p>
              </div>
              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(q)} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, background: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2L11 4L4 11H2V9L9 2Z" stroke="#555" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => handleDelete(q.id)} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, background: '#FFEBEE', border: '1px solid #F09595' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5h3v1M5.5 6v4M7.5 6v4M3 3.5l.5 7h6l.5-7" stroke="#E24B4A" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
          )
        })}

      </div>

      {/* Modale force-delete */}
      {forceDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6" style={{ background: '#fff', width: 360, border: '1px solid #E0E0E0' }}>
            <div className="flex items-center justify-center rounded-[14px] mx-auto mb-4" style={{ width: 48, height: 48, background: '#FFEBEE', border: '1px solid #F09595' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 8v5M11 15.5h.01M9.29 2.86L1.82 17a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 2.86a2 2 0 00-3.42 0z" stroke="#E24B4A" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </div>
            <h3 className="text-[15px] font-bold text-center mb-1">Station avec réponses</h3>
            <p className="text-[13px] text-center mb-4" style={{ color: '#555' }}>
              Cette station a <strong>{forceDeleteCount} réponse{forceDeleteCount > 1 ? 's' : ''}</strong> enregistrée{forceDeleteCount > 1 ? 's' : ''}.<br />
              La supprimer effacera aussi ces réponses.
            </p>
            <div className="rounded-lg p-3 mb-4" style={{ background: '#FFEBEE', border: '1px solid #F09595' }}>
              <p className="text-[11px]" style={{ color: '#E24B4A' }}>⚠ Action irréversible — les réponses des joueurs pour cette station seront définitivement perdues.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForceDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ border: '1px solid #E0E0E0', color: '#555' }}>
                Annuler
              </button>
              <button onClick={handleForceDelete} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-medium" style={{ background: '#E24B4A' }}>
                Supprimer quand même
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="rounded-2xl p-6 overflow-y-auto" style={{ background: '#fff', width: 480, maxHeight: '90vh', border: '1px solid #E0E0E0' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">{editId ? 'Modifier la station' : 'Nouvelle station'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[18px]" style={{ color: '#aaa' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#888' }}>NOM DE LA STATION *</label>
                <input value={form.stationLabel} onChange={e => setForm({ ...form, stationLabel: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1.5px solid #E0E0E0' }} placeholder="Salle Informatique" />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#888' }}>CODE 3 CHIFFRES *</label>
                <div className="relative">
                  <input value={form.stationCode} onChange={e => !editId && setForm({ ...form, stationCode: e.target.value.slice(0, 3) })} readOnly={!!editId} maxLength={3} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1.5px solid #E0E0E0', background: editId ? '#F5F5F5' : '#fff', color: editId ? '#aaa' : '#1A1A1A' }} placeholder="101" />
                  {editId && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#aaa' }}>non modifiable</span>}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-medium mb-1" style={{ color: '#888' }}>QUESTION *</label>
              <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none" style={{ border: '1.5px solid #E0E0E0' }} placeholder="Quel protocole sécurise HTTP ?" />
            </div>
            {(['A', 'B', 'C', 'D'] as const).map((opt, i) => {
              const key = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'
              return (
                <div key={opt} className="flex items-center gap-2 mb-2">
                  <input type="radio" name="correct" checked={form.correctAnswer === i} onChange={() => setForm({ ...form, correctAnswer: i })} />
                  <label className="text-[11px] font-bold w-4 flex-shrink-0">{opt}</label>
                  <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none" style={{ border: '1.5px solid #E0E0E0' }} placeholder={`Proposition ${opt}`} />
                </div>
              )
            })}
            <div className="mt-3 mb-4">
              <label className="block text-[11px] font-medium mb-1" style={{ color: '#888' }}>EXPLICATION (optionnel)</label>
              <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none" style={{ border: '1.5px solid #E0E0E0' }} placeholder="Explication de la bonne réponse…" />
            </div>
            {formError && <p className="text-[12px] mb-3" style={{ color: '#E24B4A' }}>{formError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ border: '1px solid #E0E0E0', color: '#555' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-medium" style={{ background: 'var(--color-primary)', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Enregistrement…' : editId ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
