'use client'

interface StationCardProps {
  stationLabel: string
  answered: boolean
  onClick?: () => void
}

export default function StationCard({ stationLabel, answered, onClick }: StationCardProps) {
  return (
    <div
      onClick={answered ? onClick : undefined}
      className="flex items-center gap-3 px-[13px] py-[11px] rounded-xl mb-2"
      style={{
        background: answered ? 'var(--color-success-bg)' : 'var(--bg-secondary)',
        border: answered ? '1px solid var(--color-success-border)' : '1px solid var(--border-secondary)',
        minHeight: 52,
        cursor: answered ? 'pointer' : 'default',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-[9px] flex-shrink-0"
        style={{
          width: 30,
          height: 30,
          background: answered ? '#C0DD97' : 'var(--bg-tertiary)',
        }}
      >
        {answered ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="#888" strokeWidth="1.5" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="#888" strokeWidth="1.5" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="#888" strokeWidth="1.5" />
            <rect x="9" y="9" width="1.5" height="1.5" fill="#888" />
            <rect x="11.5" y="9" width="1.5" height="1.5" fill="#888" />
            <rect x="9" y="11.5" width="1.5" height="1.5" fill="#888" />
            <rect x="11.5" y="11.5" width="1.5" height="1.5" fill="#888" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        className="flex-1 text-[13px] font-medium"
        style={{ color: answered ? '#3B6D11' : 'var(--text-primary)' }}
      >
        {stationLabel}
      </span>

      {/* Status */}
      {answered ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="#639922" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>À scanner</span>
      )}
    </div>
  )
}
