import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'text-xl font-extrabold tracking-tighter text-navy',
        className,
      )}
      aria-label="Avanxapp, ir al inicio"
    >
      Avan<span className="text-orange">x</span>app
    </Link>
  )
}
