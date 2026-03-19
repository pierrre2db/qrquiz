'use client'
import { ReactNode, InputHTMLAttributes } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: ReactNode
  error?: string
}

export default function InputField({ label, icon, error, ...props }: InputFieldProps) {
  return (
    <div className="mb-4">
      <label
        className="block mb-1 text-[11px] font-medium tracking-[0.04em]"
        style={{ color: error ? 'var(--color-danger)' : 'var(--text-tertiary)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {icon}
        </span>
        <input
          {...props}
          className={`w-full pl-9 pr-3 py-3 text-[14px] rounded-[10px] outline-none transition-all duration-150 ${props.className ?? ''}`}
          style={{
            border: error ? '1.5px solid var(--color-danger)' : '1px solid var(--border-secondary)',
            background: error ? 'var(--color-danger-bg)' : 'var(--bg-secondary)',
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.border = '1.5px solid var(--color-secondary)'
              e.target.style.background = 'var(--bg-primary)'
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.border = '1px solid var(--border-secondary)'
              e.target.style.background = 'var(--bg-secondary)'
            }
            props.onBlur?.(e)
          }}
        />
      </div>
      {error && (
        <p className="mt-1 text-[11px]" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
