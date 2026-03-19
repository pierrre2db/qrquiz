'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Participant {
  id: string; firstName: string; lastName: string; email: string; phone: string
  createdAt: string; answeredCount: number; status: string; totalActive: number
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Complet':  { bg: '#EAF3DE', color: '#3B6D11' },
  'En cours': { bg: '#E8F4FD', color: '#185FA5' },
  'Débuté':   { bg: '#F5F5F5', color: '#888' },
}

const PAGE_SIZE = 6

export default function ParticipantsPage() {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/admin/participants?${params}`)
    if (!res.ok) { router.replace('/admin/login'); return }
    const data = await res.json()
    setParticipants(data.participants)
    setTotal(data.total)
    setLoading(false)
  }, [page, search, statusFilter, router])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const downloadFile = async (type: 'csv' | 'json') => {
    const res = await fetch(`/api/admin/export/${type}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)
    a.href = url; a.download = `participants_${now}.${type}`; a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const avatarColor = (name: string) => {
    const colors = ['#2E75B6','#639922','#BA7517','#E24B4A','#8B5CF6','#0EA5E9']
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold">Participants</h1>
          <p className="text-[12px]" style={{ color: '#888' }}>{total} inscrits · max 50 simultanés</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadFile('csv')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#fff', border: '1px solid #E0E0E0', color: '#555' }}>
            ↓ CSV
          </button>
          <button onClick={() => downloadFile('json')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#fff', border: '1px solid #E0E0E0', color: '#555' }}>
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: '#aaa' }}>🔍</span>
          <input
            type="text" placeholder="Rechercher par nom ou email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: '#fff', border: '1px solid #E0E0E0' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ background: '#fff', border: '1px solid #E0E0E0', color: '#555' }}>
          <option value="">Tous</option>
          <option value="Complet">Complet</option>
          <option value="En cours">En cours</option>
          <option value="Débuté">Débuté</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid #E0E0E0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F5F5F5' }}>
              {['NOM', 'EMAIL', 'TÉLÉPHONE', 'HEURE', 'PROGRESSION', 'STATUT'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-medium tracking-wide" style={{ color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-[13px]" style={{ color: '#aaa' }}>Chargement…</td></tr>
            ) : participants.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-[13px]" style={{ color: '#aaa' }}>Aucun participant</td></tr>
            ) : participants.map((p, idx) => {
              const initials = `${p.firstName[0]}${p.lastName[0]}`.toUpperCase()
              const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS['Débuté']
              const time = new Date(p.createdAt).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
              return (
                <tr key={p.id} style={{ background: idx % 2 === 0 ? '#fff' : 'rgba(99,153,34,0.04)' }}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0"
                        style={{ width: 26, height: 26, background: avatarColor(p.firstName) }}>
                        {initials}
                      </div>
                      <span className="text-[12px] font-semibold">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ color: '#555' }}>{p.email}</td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ color: '#555' }}>{p.phone}</td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ color: '#555' }}>{time}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-medium" style={{ color: p.answeredCount === p.totalActive ? '#3B6D11' : '#185FA5' }}>
                      {p.answeredCount}/{p.totalActive}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: sc.bg, color: sc.color }}>{p.status}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-[12px]" style={{ color: '#888' }}>
            Affichage {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} sur {total}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1 rounded-lg text-[12px]" style={{ border: '1px solid #E0E0E0', background: '#fff', opacity: page === 1 ? 0.4 : 1 }}>←</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="px-2.5 py-1 rounded-lg text-[12px]"
                style={{ border: '1px solid #E0E0E0', background: page === i + 1 ? 'var(--color-primary)' : '#fff', color: page === i + 1 ? 'white' : '#555' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg text-[12px]" style={{ border: '1px solid #E0E0E0', background: '#fff', opacity: page === totalPages ? 0.4 : 1 }}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}
