import { Link, useRouterState } from '@tanstack/react-router'
import {
  Building2,
  Package,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

const items: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Obras', icon: Building2 },
  { to: '/materiales', label: 'Materiales', icon: Package },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/cuenta', label: 'Cuenta', icon: UserRound },
]

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ' +
                  (active ? 'text-orange' : 'text-gray-500')
                }
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
