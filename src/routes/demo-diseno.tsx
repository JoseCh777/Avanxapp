import { createFileRoute } from '@tanstack/react-router'
import { Building2, Plus, Search } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, Input } from '@/components/ui/input'

export const Route = createFileRoute('/demo-diseno')({
  component: DemoDisenoPage,
})

const swatches = [
  { name: 'Azul principal', hex: '#0B2D5B', className: 'bg-navy' },
  { name: 'Azul hover', hex: '#123D78', className: 'bg-navy-hover' },
  { name: 'Naranja', hex: '#FF6600', className: 'bg-orange' },
  { name: 'Gris claro', hex: '#F5F7FA', className: 'bg-gray-50 border' },
  { name: 'Gris oscuro', hex: '#172334', className: 'bg-ink' },
  { name: 'Gris auxiliar', hex: '#94A3B8', className: 'bg-aux' },
]

const functionales = [
  { name: 'Éxito', hex: '#16845B', className: 'bg-success' },
  { name: 'Advertencia', hex: '#D98A00', className: 'bg-warning' },
  { name: 'Error', hex: '#C53B45', className: 'bg-danger' },
]

function DemoDisenoPage() {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
          Sistema de diseño
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">
          Componentes base
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Muestra de tokens y componentes de la guía de marca v1.0.
        </p>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Colores</h2>
        <div className="grid grid-cols-3 gap-3">
          {swatches.map((swatch) => (
            <div key={swatch.hex} className="grid gap-1.5">
              <div className={`h-16 rounded-md ${swatch.className}`} />
              <p className="text-xs font-bold text-navy">{swatch.name}</p>
              <p className="font-mono text-[11px] text-gray-500">
                {swatch.hex}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {functionales.map((swatch) => (
            <div key={swatch.hex} className="grid gap-1.5">
              <div className={`h-10 rounded-md ${swatch.className}`} />
              <p className="text-xs font-bold text-navy">{swatch.name}</p>
              <p className="font-mono text-[11px] text-gray-500">
                {swatch.hex}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Botones</h2>
        <div className="flex flex-wrap gap-2">
          <Button>
            Primario
            <Plus className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Eliminar</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Etiquetas de estado</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="blue">En proceso</Badge>
          <Badge variant="orange">Destacado</Badge>
          <Badge variant="green">Completado</Badge>
          <Badge variant="gray">Borrador</Badge>
          <Badge variant="danger">Vencido</Badge>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Formularios</h2>
        <Card className="grid gap-3">
          <Field label="Nombre" htmlFor="demo-name" hint="Como aparece en tu perfil.">
            <Input id="demo-name" placeholder="Escribe tu nombre" />
          </Field>
          <Field label="Buscar material" htmlFor="demo-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <Input
                id="demo-search"
                className="pl-10"
                placeholder="Cemento, arena…"
              />
            </div>
          </Field>
          <Field
            label="Teléfono"
            htmlFor="demo-phone"
            error="Este campo es obligatorio."
          >
            <Input id="demo-phone" aria-invalid="true" />
          </Field>
        </Card>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Alertas</h2>
        <Alert variant="info" title="Modo sin conexión">
          Tus datos se guardan en el teléfono y se envían al volver la señal.
        </Alert>
        <Alert variant="success" title="Obra guardada" />
        <Alert variant="warning" title="Poco espacio disponible">
          Libera espacio para seguir guardando fotos.
        </Alert>
        <Alert variant="danger" title="No se pudo iniciar sesión">
          Revisa tu teléfono y contraseña.
        </Alert>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Tarjetas y vacíos</h2>
        <Card>
          <Badge variant="orange">Nuevo</Badge>
          <CardTitle className="mt-2">Compra registrada</CardTitle>
          <CardDescription>
            20 bultos de cemento en Ferretería El Progreso.
          </CardDescription>
        </Card>
        <EmptyState
          icon={<Building2 className="size-7" aria-hidden="true" />}
          title="Aún no tienes obras"
          description="Crea tu primera obra para registrar avance, compras e inventario."
          action={<Button>Crear obra</Button>}
        />
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Tipografía</h2>
        <p className="text-4xl font-extrabold tracking-tight text-navy">
          H1 · 40
        </p>
        <p className="text-2xl font-bold tracking-tight text-navy">H2 · 28</p>
        <p className="text-xl font-bold text-navy">H3 · 20</p>
        <p className="text-base text-ink">Body · 16 — Texto de lectura.</p>
        <p className="text-[13px] text-gray-700">Small · 13 — Auxiliar.</p>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-navy">Radios</h2>
        <div className="flex gap-3">
          <div className="grid h-16 flex-1 place-items-center rounded-sm border-2 border-navy text-xs font-bold text-navy">
            8 px
          </div>
          <div className="grid h-16 flex-1 place-items-center rounded-md border-2 border-navy text-xs font-bold text-navy">
            14 px
          </div>
          <div className="grid h-16 flex-1 place-items-center rounded-lg border-2 border-navy text-xs font-bold text-navy">
            22 px
          </div>
        </div>
      </section>
    </div>
  )
}
