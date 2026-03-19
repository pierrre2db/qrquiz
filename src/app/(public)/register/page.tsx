'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import InputField from '@/components/InputField'
import CTAButton from '@/components/CTAButton'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\+?\d{7,15}$/

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/me').then((r) => {
      if (r.ok) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.firstName.trim().length < 2) e.firstName = 'Min 2 caractères'
    if (form.lastName.trim().length < 2) e.lastName = 'Min 2 caractères'
    if (!phoneRegex.test(form.phone.trim())) e.phone = 'Numéro invalide'
    if (!emailRegex.test(form.email.trim())) e.email = 'Email invalide'
    return e
  }

  const isValid = form.firstName.trim().length >= 2
    && form.lastName.trim().length >= 2
    && phoneRegex.test(form.phone.trim())
    && emailRegex.test(form.email.trim())

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
      }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      if (res.status === 409) setErrors({ email: data.error })
      else setErrors({ form: data.error || 'Erreur inattendue' })
      setLoading(false)
    }
  }

  if (checking) return <div className="min-h-screen" style={{ background: 'var(--color-primary)' }} />

  return (
    <div>
      {/* Header */}
      <MobileHeader>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center rounded-[14px]"
            style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="2" />
              <rect x="16" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="2" />
              <rect x="2" y="16" width="10" height="10" rx="2" stroke="white" strokeWidth="2" />
              <rect x="17" y="17" width="3" height="3" fill="white" />
              <rect x="22" y="17" width="3" height="3" fill="white" />
              <rect x="17" y="22" width="3" height="3" fill="white" />
              <rect x="22" y="22" width="3" height="3" fill="white" />
            </svg>
          </div>
          <div>
            <div className="text-white text-[18px] font-medium">QR-QUIZ</div>
            <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Concours de l'école</div>
          </div>
        </div>
      </MobileHeader>

      {/* Form */}
      <div className="px-5 pt-5 pb-8">
        <h2 className="text-[14px] font-medium mb-5" style={{ color: 'var(--text-primary)' }}>
          Créer mon profil
        </h2>

        <InputField
          label="PRÉNOM"
          icon="👤"
          type="text"
          placeholder="Jean"
          value={form.firstName}
          onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrors({ ...errors, firstName: '' }) }}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <InputField
          label="NOM"
          icon="👤"
          type="text"
          placeholder="Dupont"
          value={form.lastName}
          onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrors({ ...errors, lastName: '' }) }}
          error={errors.lastName}
          autoComplete="family-name"
        />
        <InputField
          label="TÉLÉPHONE"
          icon="📞"
          type="tel"
          placeholder="+32 470 123 456"
          value={form.phone}
          onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: '' }) }}
          error={errors.phone}
          autoComplete="tel"
        />
        <InputField
          label="E-MAIL ★"
          icon="✉"
          type="email"
          placeholder="jean.d@exemple.com"
          value={form.email}
          onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
          error={errors.email}
          autoComplete="email"
        />

        {errors.form && (
          <p className="text-[12px] mb-4 text-center" style={{ color: 'var(--color-danger)' }}>{errors.form}</p>
        )}

        <CTAButton onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? 'Inscription…' : 'Commencer le concours'}
        </CTAButton>

        <p className="text-center text-[11px] mt-3" style={{ color: 'var(--text-tertiary)' }}>
          Tous les champs sont obligatoires
        </p>
      </div>
    </div>
  )
}
