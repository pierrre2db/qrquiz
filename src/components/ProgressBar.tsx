'use client'

interface ProgressBarProps {
  total: number
  answered: number
}

export default function ProgressBar({ total, answered }: ProgressBarProps) {
  return (
    <div className="flex gap-[3px] mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-[6px] flex-1 rounded-sm"
          style={{
            background: i < answered ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
          }}
        />
      ))}
    </div>
  )
}
