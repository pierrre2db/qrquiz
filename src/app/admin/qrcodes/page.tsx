'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface QRCode { id: string; stationLabel: string; stationCode: string; url: string; hasImage: boolean; order: number }

export default function QRCodesPage() {
  const router = useRouter()
  const [qrcodes, setQRCodes] = useState<QRCode[]>([])
  const [generating, setGenerating] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [zoomedQR, setZoomedQR] = useState<QRCode | null>(null)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/qrcodes')
    if (!res.ok) { router.replace('/admin/login'); return }
    setQRCodes(await res.json())
  }, [router])

  useEffect(() => { load() }, [load])

  const generateAll = async () => {
    setGenerating(true)
    await fetch('/api/admin/qrcodes/generate', { method: 'POST' })
    await load(); setGenerating(false)
  }

  const regenerate = async (id: string) => {
    setRegeneratingId(id)
    await fetch(`/api/admin/qrcodes/${id}/regenerate`, { method: 'POST' })
    await load(); setRegeneratingId(null)
  }

  const downloadPNG = async (id: string, label: string) => {
    const res = await fetch(`/api/admin/qrcodes/${id}/image`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `qr_${label}.png`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold">QR Codes</h1>
          <p className="text-[12px]" style={{ color: '#888' }}>{qrcodes.length} stations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAll} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white" style={{ background: 'var(--color-secondary)', opacity: generating ? 0.6 : 1 }}>
            {generating ? '⏳ Génération…' : '⬛ Générer tout'}
          </button>
          <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium" style={{ background: '#fff', border: '1px solid #E0E0E0', color: '#555' }}>
            🖨 Imprimer tout
          </button>
        </div>
      </div>

      {/* QR accueil */}
      <div className="rounded-xl p-4 mb-5" style={{ background: '#E8F4FD', border: '1.5px solid #B5D4F4' }}>
        <div className="flex items-center gap-4">
          <div className="rounded-lg p-1.5 flex-shrink-0" style={{ background: '#fff', border: '1px solid #B5D4F4' }}>
            <div className="rounded" style={{ width: 64, height: 64, background: '#E8F4FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="3" y="3" width="14" height="14" rx="2" stroke="#2E75B6" strokeWidth="2" />
                <rect x="23" y="3" width="14" height="14" rx="2" stroke="#2E75B6" strokeWidth="2" />
                <rect x="3" y="23" width="14" height="14" rx="2" stroke="#2E75B6" strokeWidth="2" />
                <rect x="24" y="24" width="4" height="4" fill="#2E75B6" />
                <rect x="32" y="24" width="4" height="4" fill="#2E75B6" />
                <rect x="24" y="32" width="4" height="4" fill="#2E75B6" />
                <rect x="32" y="32" width="4" height="4" fill="#2E75B6" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg mb-1" style={{ background: 'var(--color-secondary)' }}>
              <span className="text-white text-[11px] font-medium">Entrée du jeu</span>
            </div>
            <p className="text-[12px] mb-0.5" style={{ color: 'var(--color-secondary)' }}>{baseUrl}/register</p>
            <p className="text-[11px]" style={{ color: '#185FA5' }}>À afficher à l'accueil — lance l'inscription</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <a href="/register" target="_blank" className="px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)' }}>Aperçu</a>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-[10px]">
        {qrcodes.map((qr) => (
          <div key={qr.id} className="rounded-[10px] p-3 flex flex-col items-center gap-2" style={{ border: '1px solid #E0E0E0', background: '#fff' }}>
            {/* QR preview */}
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ width: 72, height: 72, background: '#F5F5F5', border: '1px solid #E0E0E0', cursor: qr.hasImage ? 'zoom-in' : 'default' }}
              onClick={() => qr.hasImage && setZoomedQR(qr)}
              title={qr.hasImage ? 'Cliquer pour agrandir' : ''}
            >
              {qr.hasImage ? (
                <img src={`/api/admin/qrcodes/${qr.id}/image`} alt={qr.stationLabel} className="rounded" style={{ width: 60, height: 60, objectFit: 'contain' }} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="#ccc" strokeWidth="1.5" />
                  <rect x="18" y="2" width="12" height="12" rx="2" stroke="#ccc" strokeWidth="1.5" />
                  <rect x="2" y="18" width="12" height="12" rx="2" stroke="#ccc" strokeWidth="1.5" />
                </svg>
              )}
            </div>
            <p className="text-[12px] font-bold text-center">{qr.stationLabel}</p>
            <p className="text-[10px] text-center" style={{ color: '#888' }}>{qr.stationCode}</p>
            <div className="flex gap-1.5 w-full">
              <button onClick={() => downloadPNG(qr.id, qr.stationCode)} disabled={!qr.hasImage} className="flex-1 py-1 rounded-lg text-[10px] font-medium" style={{ background: '#F5F5F5', border: '1px solid #E0E0E0', color: qr.hasImage ? '#555' : '#ccc' }}>
                ↓ PNG
              </button>
              <button onClick={() => regenerate(qr.id)} disabled={regeneratingId === qr.id} className="flex-1 py-1 rounded-lg text-[10px] font-medium" style={{ background: '#F5F5F5', border: '1px solid #E0E0E0', color: '#555' }}>
                {regeneratingId === qr.id ? '…' : '↻'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom modal */}
      {zoomedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setZoomedQR(null)}>
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: '#fff', maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[15px] font-bold">{zoomedQR.stationLabel}</p>
                <p className="text-[12px]" style={{ color: '#888' }}>Code station : <strong>{zoomedQR.stationCode}</strong></p>
              </div>
              <button onClick={() => setZoomedQR(null)} className="text-[20px] leading-none" style={{ color: '#aaa' }}>✕</button>
            </div>
            <img
              src={`/api/admin/qrcodes/${zoomedQR.id}/image`}
              alt={zoomedQR.stationLabel}
              style={{ width: 300, height: 300, objectFit: 'contain', borderRadius: 8 }}
            />
            <p className="text-[11px] text-center px-2 py-1.5 rounded-lg w-full" style={{ background: '#F5F5F5', color: '#555', wordBreak: 'break-all' }}>
              {zoomedQR.url}
            </p>
            <div className="flex gap-2 w-full">
              <a href={zoomedQR.url} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl text-[12px] font-medium text-center" style={{ border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)' }}>
                Tester l'URL →
              </a>
              <button onClick={() => { downloadPNG(zoomedQR.id, zoomedQR.stationCode); setZoomedQR(null) }} className="flex-1 py-2 rounded-xl text-[12px] font-medium text-white" style={{ background: 'var(--color-primary)' }}>
                ↓ Télécharger PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="rounded-2xl p-5" style={{ background: '#fff', width: 520, border: '1px solid #E0E0E0' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-bold">Aperçu impression</h2>
              <button onClick={() => setShowPrintModal(false)} style={{ color: '#aaa' }}>✕</button>
            </div>
            <div className="rounded-lg p-3 mb-4" style={{ background: '#F8F8F8', border: '1px solid #E0E0E0' }}>
              <div className="grid grid-cols-2 gap-2">
                {qrcodes.slice(0, 8).map(qr => (
                  <div key={qr.id} className="rounded p-2 text-center flex flex-col items-center gap-1" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
                    <div style={{ width: 60, height: 60, background: '#F5F5F5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {qr.hasImage
                        ? <img src={`/api/admin/qrcodes/${qr.id}/image`} style={{ width: 52, height: 52 }} />
                        : <span style={{ fontSize: 24 }}>⬛</span>}
                    </div>
                    <p style={{ fontSize: 9, fontWeight: 600 }}>{qr.stationLabel}</p>
                    <p style={{ fontSize: 11, fontWeight: 700 }}>{qr.stationCode}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPrintModal(false)} className="flex-1 py-2.5 rounded-xl text-[13px]" style={{ border: '1px solid #E0E0E0', color: '#555' }}>Fermer</button>
              <button onClick={() => { setShowPrintModal(false); window.open('/admin/qrcodes/print', '_blank') }} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-medium flex items-center justify-center gap-2" style={{ background: 'var(--color-primary)' }}>
                🖨 Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
