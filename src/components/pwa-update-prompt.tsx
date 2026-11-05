import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-md border border-navy/15 bg-white p-3 shadow-soft md:bottom-6"
    >
      <p className="text-sm font-semibold text-navy">
        Hay una nueva versión disponible.
      </p>
      <div className="flex shrink-0 gap-2">
        <Button
          size="default"
          className="h-10 px-3"
          onClick={() => void updateServiceWorker(true)}
        >
          Actualizar
        </Button>
        <Button
          variant="ghost"
          className="h-10 px-3"
          onClick={() => setNeedRefresh(false)}
        >
          Luego
        </Button>
      </div>
    </div>
  )
}
