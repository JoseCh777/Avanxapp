import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/obras/$id')({
  component: ObraPage,
})

function ObraPage() {
  const { id } = Route.useParams()

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Obra
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Detalle de la obra
        </h1>
      </div>
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5" aria-hidden="true" />
          {id}
        </CardTitle>
        <CardDescription>
          Aquí irán avance, fotos, compras e inventario de la obra.
        </CardDescription>
      </Card>
    </div>
  )
}
