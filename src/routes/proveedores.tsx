import { createFileRoute } from '@tanstack/react-router'
import { Truck } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export const Route = createFileRoute('/proveedores')({
  component: ProveedoresPage,
})

function ProveedoresPage() {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Directorio
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Proveedores
        </h1>
      </div>
      <EmptyState
        icon={<Truck className="size-7" aria-hidden="true" />}
        title="Sin proveedores"
        description="Guarda a quién le compras para tener su historial a mano."
      />
    </div>
  )
}
