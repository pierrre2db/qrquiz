'use client'
import { useState, useEffect } from 'react'

interface QRCode { id: string; stationLabel: string; stationCode: string; hasImage: boolean }

export default function PrintPage() {
  const [qrcodes, setQRCodes] = useState<QRCode[]>([])

  useEffect(() => {
    fetch('/api/admin/qrcodes').then(r => r.json()).then(setQRCodes)
  }, [])

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
          .qr-cell { page-break-inside: avoid; border: 1px solid #ccc; padding: 16px; text-align: center; }
        }
        @media screen {
          body { background: #f0f0f0; }
          .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; max-width: 800px; margin: 0 auto; }
          .qr-cell { background: white; border: 1px solid #ccc; padding: 16px; text-align: center; border-radius: 8px; }
        }
      `}</style>

      <div className="no-print" style={{ background: '#1E3A5F', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'white', fontWeight: 600 }}>QR-QUIZ — Page d'impression</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{ background: 'white', color: '#1E3A5F', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            🖨 Imprimer
          </button>
          <button onClick={() => window.close()} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>

      <div className="print-grid">
        {qrcodes.map(qr => (
          <div key={qr.id} className="qr-cell">
            {qr.hasImage ? (
              <img src={`/api/admin/qrcodes/${qr.id}/image`} alt={qr.stationLabel} style={{ width: 200, height: 200, margin: '0 auto 8px' }} />
            ) : (
              <div style={{ width: 200, height: 200, background: '#F5F5F5', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>⬛</div>
            )}
            <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0' }}>{qr.stationLabel}</p>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{qr.stationCode}</p>
          </div>
        ))}
      </div>
    </>
  )
}
