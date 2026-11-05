import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-navy text-white hover:bg-navy-hover',
        secondary: 'bg-orange text-white hover:brightness-95',
        outline: 'border-2 border-navy bg-white text-navy hover:bg-gray-50',
        ghost: 'border border-gray-300 bg-transparent text-navy hover:bg-gray-100',
        danger: 'bg-danger text-white hover:brightness-95',
      },
      size: {
        default: 'h-12',
        lg: 'h-14 px-6 text-base',
        icon: 'h-12 w-12 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

