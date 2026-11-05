import { createFileRoute } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export const Route = createFileRoute('/materiales')({
  component: MaterialesPage,
})

function MaterialesPage() {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Catálogo
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Materiales
        </h1>
      </div>
      <EmptyState
        icon={<Package className="size-7" aria-hidden="true" />}
        title="Sin materiales todavía"
        description="Tu catálogo se reutiliza entre todas tus obras."
      />
    </div>
  )
}
