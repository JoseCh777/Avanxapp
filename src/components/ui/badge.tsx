import * as React from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold',
  {
    variants: {
      variant: {
        blue: 'bg-[#E8F0FA] text-navy',
        orange: 'bg-orange-soft text-orange-ink',
        green: 'bg-success-soft text-success',
        gray: 'bg-gray-100 text-gray-700',
        danger: 'bg-danger-soft text-danger',
      },
    },
    defaultVariants: {
      variant: 'gray',
    },
  },
)

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
