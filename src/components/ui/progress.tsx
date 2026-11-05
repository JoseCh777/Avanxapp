import { cn } from '@/lib/utils'

export function Progress({
  value,
  className,
  label,
}: {
  value: number
  className?: string
  label?: string
}) {
  const safe = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('grid gap-1.5', className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
          <span>{label}</span>
          <span>{Math.round(safe)}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safe)}
        aria-label={label ?? 'Avance de la obra'}
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-orange transition-[width]"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  )
}
