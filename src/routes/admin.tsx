import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Administración
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Cuentas y planes
        </h1>
      </div>
      <Card>
        <CardTitle>Panel en construcción</CardTitle>
        <CardDescription>
          Aquí se crearán cuentas, se resetearán contraseñas y se fijarán los
          planes.
        </CardDescription>
        <Button variant="outline" className="mt-4" asChild>
          <a href="/">Volver a obras</a>
        </Button>
      </Card>
    </div>
  )
}
