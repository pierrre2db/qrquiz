'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function StationByCodePage() {
  const params = useParams()
  const code = params.code as string

  useEffect(() => {
    const resolve = async () => {
      const meRes = await fetch('/api/me', { cache: 'no-store' })
      if (!meRes.ok) {
        window.location.replace('/register')
        return
      }

      const res = await fetch('/api/stations/by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (!res.ok) {
        window.location.replace('/dashboard')
        return
      }

      const { stationId } = await res.json()
      window.location.replace(`/station/${stationId}`)
    }

    resolve()
  }, [code])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
