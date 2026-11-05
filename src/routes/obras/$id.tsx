import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Camera,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  StickyNote,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/db'
import { calcularAvance } from '@/lib/obras'

export const Route = createFileRoute('/obras/$id')({
  component: ObraPage,
})

function ObraPage() {
  const { id } = Route.useParams()
  const obra = useLiveQuery(() => db.obras.get(id), [id])
  const etapas = useLiveQuery(
    async () =>
      (await db.etapas.where('obra_id').equals(id).toArray())
        .filter((etapa) => !etapa.deleted_at)
        .sort((a, b) => a.orden - b.orden),
    [id],
  )
  const pendientes = useLiveQuery(
    () =>
      db.outbox
        .toArray()
        .then(
          (items) =>
            items.filter(
              (item) =>
                (item.table === 'obras' && item.row.id === id) ||
                item.row.obra_id === id,
            ).length,
        ),
    [id],
  )

  const avance = useMemo(() => calcularAvance(etapas ?? []), [etapas])

  if (obra === undefined) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-live="polite">
        <div className="h-8 w-2/3 animate-pulse rounded-sm bg-gray-100" />
        <div className="h-28 animate-pulse rounded-md bg-gray-100" />
        <div className="h-48 animate-pulse rounded-md bg-gray-100" />
      </div>
    )
  }

  if (obra === null) {
    return (
      <EmptyState
        title="Obra no encontrada"
        description="Puede que se haya archivado o eliminado en este dispositivo."
        action={
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-5 text-sm font-bold text-white"
          >
            Volver a mis obras
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-4">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-navy"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mis obras
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
            Obra
          </p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-navy">
            {obra.nombre}
          </h1>
          <p className="text-sm text-gray-500">
            {obra.cliente_nombre || 'Sin cliente'}
          </p>
        </div>
        <Badge variant={obra.estado === 'activa' ? 'green' : 'gray'}>
          {obra.estado === 'activa' ? 'Activa' : 'Archivada'}
        </Badge>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Avance general</CardTitle>
          {pendientes ? (
            <Badge variant="orange">{pendientes} sin sincronizar</Badge>
          ) : (
            <Badge variant="green">Sincronizada</Badge>
          )}
        </div>
        <Progress value={avance} className="mt-3" />
        <CardDescription className="mt-2">
          Promedio ponderado de {etapas?.length ?? 0} etapas.
        </CardDescription>
      </Card>

      {obra.cliente_telefono || obra.direccion || obra.notas ? (
        <Card>
          <CardTitle>Datos de la obra</CardTitle>
          <div className="mt-3 grid gap-2 text-sm text-gray-700">
            {obra.cliente_telefono ? (
              <a
                href={`tel:${obra.cliente_telefono}`}
                className="inline-flex items-center gap-2 font-semibold text-navy"
              >
                <Phone className="size-4" aria-hidden="true" />
                {obra.cliente_telefono}
              </a>
            ) : null}
            {obra.direccion ? (
              <p className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-gray-500" aria-hidden="true" />
                {obra.direccion}
              </p>
            ) : null}
            {obra.notas ? (
              <p className="inline-flex items-start gap-2">
                <StickyNote
                  className="mt-0.5 size-4 shrink-0 text-gray-500"
                  aria-hidden="true"
                />
                {obra.notas}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Etapas</CardTitle>
        <CardDescription className="mb-3">
          Peso de cada etapa dentro del avance total.
        </CardDescription>
        <ul className="grid gap-2">
          {(etapas ?? []).map((etapa) => (
            <li
              key={etapa.id}
              className="rounded-sm border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-navy">{etapa.nombre}</p>
                <span className="text-xs font-bold text-gray-500">
                  {etapa.porcentaje}% · peso {etapa.peso}%
                </span>
              </div>
              <Progress value={etapa.porcentaje} className="mt-2" />            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <EmptyState
          icon={<Camera className="size-6" aria-hidden="true" />}
          title="Fotos"
          description="Aquí aparecerá el avance fotográfico."
        />
        <EmptyState
          icon={<ReceiptText className="size-6" aria-hidden="true" />}
          title="Compras"
          description="Registra compras y recibos."
        />
        <EmptyState
          icon={<Package className="size-6" aria-hidden="true" />}
          title="Inventario"
          description="Saldos de materiales de la obra."
        />
      </div>
    </div>
  )
}
