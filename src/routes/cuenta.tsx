import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/cuenta')({
  component: CuentaPage,
})

function CuentaPage() {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Ajustes
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Mi cuenta
        </h1>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-gray-100 text-navy">
            <UserRound className="size-6" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Maestro de obra</CardTitle>
            <CardDescription>Sesión pendiente de integrar</CardDescription>
          </div>
        </div>
        <CardContent className="mt-4 grid gap-2">
          <Button variant="outline" asChild>
            <a href="/admin">
              <ShieldCheck className="size-5" aria-hidden="true" />
              Panel de administración
            </a>
          </Button>
          <Button variant="ghost" disabled>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
