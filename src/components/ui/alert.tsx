import * as React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  info: {
    container: 'border-navy/15 bg-navy/5 text-navy',
    icon: Info,
  },
  success: {
    container: 'border-success/20 bg-success-soft text-success',
    icon: CheckCircle2,
  },
  warning: {
    container: 'border-warning/25 bg-warning-soft text-warning',
    icon: AlertTriangle,
  },
  danger: {
    container: 'border-danger/20 bg-danger-soft text-danger',
    icon: XCircle,
  },
} as const

export type AlertVariant = keyof typeof variants

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: AlertVariant
  title: string
  children?: React.ReactNode
  className?: string
}) {
  const { container, icon: Icon } = variants[variant]
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-md border p-3.5 text-sm',
        container,
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="grid gap-0.5">
        <p className="font-bold">{title}</p>
        {children ? <div className="opacity-90">{children}</div> : null}
      </div>
    </div>
  )
}
