import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { BottomNav } from '@/components/bottom-nav'
import { ConnectionBadge } from '@/components/connection-badge'
import { Logo } from '@/components/logo'
import { PwaUpdatePrompt } from '@/components/pwa-update-prompt'

const publicRoutes = ['/login', '/cambiar-clave', '/v/']

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route),
  )

  if (isPublic) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <ConnectionBadge />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />
      <PwaUpdatePrompt />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
