import { createFileRoute } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({ component: ObrasPage })

function ObrasPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
            Panel
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">
            Mis obras
          </h1>
        </div>
        <Badge variant="blue">0 activas</Badge>
      </div>

      <EmptyState
        icon={<Building2 className="size-7" aria-hidden="true" />}
        title="Aún no tienes obras"
        description="Crea tu primera obra para registrar avance, compras e inventario."
        action={
          <Button disabled>
            <Plus className="size-5" aria-hidden="true" />
            Crear obra
          </Button>
        }
      />
    </div>
  )
}
