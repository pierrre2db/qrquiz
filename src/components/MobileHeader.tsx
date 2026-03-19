'use client'
import { ReactNode } from 'react'

interface MobileHeaderProps {
  children: ReactNode
}

export default function MobileHeader({ children }: MobileHeaderProps) {
  return (
    <div style={{ background: 'var(--color-primary)' }} className="px-5 pt-5 pb-6">
      {children}
    </div>
  )
}
