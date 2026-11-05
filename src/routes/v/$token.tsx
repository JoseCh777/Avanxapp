import { createFileRoute } from '@tanstack/react-router'
import { Building2, Camera, ReceiptText, Package } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/v/$token')({
  component: VistaDuenoPage,
})

function VistaDuenoPage() {
  const { token } = Route.useParams()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <Badge variant="gray">Solo lectura</Badge>
      </header>

      <div className="mb-6">
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Vista del dueño
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Avance de la obra
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Enlace: {token.slice(0, 12)}…
        </p>
      </div>

      <div className="grid gap-3">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-navy" aria-hidden="true" />
            Resumen
          </CardTitle>
          <CardDescription>
            Esta vista se conectará a la Edge Function owner-view (B1).
          </CardDescription>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <Card className="grid place-items-center gap-1 p-3 text-center">
            <Camera className="size-5 text-navy" aria-hidden="true" />
            <span className="text-xs font-bold text-gray-700">Fotos</span>
          </Card>
          <Card className="grid place-items-center gap-1 p-3 text-center">
            <ReceiptText className="size-5 text-navy" aria-hidden="true" />
            <span className="text-xs font-bold text-gray-700">Compras</span>
          </Card>
          <Card className="grid place-items-center gap-1 p-3 text-center">
            <Package className="size-5 text-navy" aria-hidden="true" />
            <span className="text-xs font-bold text-gray-700">Inventario</span>
          </Card>
        </div>
      </div>
    </div>
  )
}
