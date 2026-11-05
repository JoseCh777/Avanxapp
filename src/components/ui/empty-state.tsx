import * as React from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-gray-300 bg-white px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="grid size-14 place-items-center rounded-full bg-gray-100 text-navy">
          {icon}
        </div>
      ) : null}
      <div className="grid gap-1">
        <p className="font-bold text-navy">{title}</p>
        {description ? (
          <p className="max-w-xs text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
