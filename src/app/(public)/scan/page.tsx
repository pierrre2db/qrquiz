'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

type ScanStatus = 'loading' | 'scanning' | 'denied' | 'timeout' | 'error'

const SCAN_TIMEOUT_MS = 30000

function QRScannerInner({ onSuccess, onError }: { onSuccess: (url: string) => void; onError: (err: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!containerRef.current || started.current) return
    started.current = true

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {})
          onSuccess(decodedText)
        },
        () => {}
      ).catch((err: unknown) => {
        onError(String(err))
      })
    })

    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [onSuccess, onError])

  return <div id="qr-reader" ref={containerRef} style={{ width: '100%' }} />
}

const QRScanner = dynamic(() => Promise.resolve(QRScannerInner), { ssr: false })

export default function ScanPage() {
  const router = useRouter()
  const [status, setStatus] = useState<ScanStatus>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check session
    fetch('/api/me').then((r) => {
      if (!r.ok) { router.replace('/register'); return }
      setStatus('scanning')
      timeoutRef.current = setTimeout(() => setStatus('timeout'), SCAN_TIMEOUT_MS)
    })
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [router])

  const handleSuccess = (url: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    try {
      const parsed = new URL(url)
      const byCode = parsed.pathname.match(/^\/station\/code\/(\d{3})$/)
      const byId = parsed.pathname.match(/^\/station\/([a-f0-9-]+)$/)
      if (byCode) {
        window.location.href = `/station/code/${byCode[1]}`
      } else if (byId) {
        window.location.href = `/station/${byId[1]}`
      } else {
        setErrorMsg('QR code non reconnu — ce code n\'appartient pas à ce concours')
        setStatus('error')
      }
    } catch {
      setErrorMsg('QR code invalide')
      setStatus('error')
    }
  }

  const handleError = (err: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (err.toLowerCase().includes('permission') || err.toLowerCase().includes('notallowed') || err.toLowerCase().includes('denied')) {
      setStatus('denied')
    } else {
      setErrorMsg(err)
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)' }} className="px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center rounded-lg"
          style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-white text-[15px] font-medium">Scanner un QR code</p>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-[14px]">Démarrage de la caméra…</p>
          </div>
        )}

        {status === 'scanning' && (
          <div className="w-full max-w-sm">
            {/* Viewfinder overlay */}
            <div className="relative mb-4">
              <div className="overflow-hidden rounded-2xl" style={{ border: '2px solid rgba(255,255,255,0.3)' }}>
                <QRScanner onSuccess={handleSuccess} onError={handleError} />
              </div>
              {/* Corner markers */}
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 border-white ${cls}`} />
              ))}
            </div>
            <p className="text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Pointez la caméra vers le QR code de la station
            </p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="text-center max-w-xs">
            <div className="text-5xl mb-4">⏱</div>
            <p className="text-white text-[16px] font-medium mb-2">Aucun QR code détecté</p>
            <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Assurez-vous que le QR code est bien éclairé et centré dans le cadre.
            </p>
            <button
              onClick={() => { setStatus('scanning'); timeoutRef.current = setTimeout(() => setStatus('timeout'), SCAN_TIMEOUT_MS) }}
              className="block w-full py-3 rounded-xl text-white text-[14px] font-medium mb-3"
              style={{ background: 'var(--color-secondary)' }}
            >
              Réessayer
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="block w-full py-3 rounded-xl text-[14px] font-medium"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              Utiliser le code à 3 chiffres
            </button>
          </div>
        )}

        {status === 'denied' && (
          <div className="text-center max-w-xs">
            <div className="text-5xl mb-4">📵</div>
            <p className="text-white text-[16px] font-medium mb-2">Accès à la caméra refusé</p>
            <p className="text-[13px] mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Autorisez l'accès à la caméra dans les réglages de votre navigateur, ou utilisez le code à 3 chiffres imprimé sous chaque QR code.
            </p>
            <p className="text-[11px] mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ⚠ La caméra nécessite une connexion HTTPS
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="block w-full py-3 rounded-xl text-[14px] font-medium"
              style={{ background: 'var(--color-primary)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Utiliser le code à 3 chiffres
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center max-w-xs">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-white text-[16px] font-medium mb-2">QR code non reconnu</p>
            <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {errorMsg || 'Ce QR code n\'appartient pas à ce concours.'}
            </p>
            <button
              onClick={() => setStatus('scanning')}
              className="block w-full py-3 rounded-xl text-white text-[14px] font-medium mb-3"
              style={{ background: 'var(--color-secondary)' }}
            >
              Scanner à nouveau
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="block w-full py-3 rounded-xl text-[14px] font-medium"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              Retour au tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
