'use client'
import { ReactNode } from 'react'

interface CTAButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  variant?: 'primary' | 'outline' | 'warning'
  className?: string
}

export default function CTAButton({
  children,
  onClick,
  disabled,
  type = 'button',
  variant = 'primary',
  className = '',
}: CTAButtonProps) {
  const base = 'w-full py-[14px] px-4 rounded-xl text-[15px] font-medium transition-all duration-150 flex items-center justify-center gap-2'

  const variants = {
    primary: disabled
      ? 'opacity-40 cursor-not-allowed text-white'
      : 'text-white cursor-pointer active:opacity-80',
    outline: 'border text-[#1E3A5F] bg-transparent cursor-pointer active:opacity-70',
    warning: disabled
      ? 'opacity-40 cursor-not-allowed text-white'
      : 'text-white cursor-pointer active:opacity-80',
  }

  const backgrounds = {
    primary: { background: 'var(--color-primary)' },
    outline: { borderColor: 'var(--color-primary)' },
    warning: { background: 'var(--color-warning)' },
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      style={backgrounds[variant]}
    >
      {children}
    </button>
  )
}
