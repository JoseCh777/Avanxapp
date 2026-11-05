import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Camera,
  History,
  MapPin,
  Package,
  Phone,
  Plus,
  ReceiptText,
  StickyNote,
} from 'lucide-react'
import { RegistrarAvanceDialog } from '@/components/obras/registrar-avance-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/db'
import { calcularAvance, formatearFecha } from '@/lib/obras'

export const Route = createFileRoute('/obras/$id')({
  component: ObraPage,
})

function ObraPage() {
  const { id } = Route.useParams()
  const [avanceAbierto, setAvanceAbierto] = useState(false)
  const [etapaInicial, setEtapaInicial] = useState<string | null>(null)

  const obra = useLiveQuery(() => db.obras.get(id), [id])
  const etapas = useLiveQuery(
    async () =>
      (await db.etapas.where('obra_id').equals(id).toArray())
        .filter((etapa) => !etapa.deleted_at)
        .sort((a, b) => a.orden - b.orden),
    [id],
  )
  const avances = useLiveQuery(
    async () =>
      (await db.etapaAvances.where('obra_id').equals(id).toArray()).sort(
        (a, b) => b.captured_at.localeCompare(a.captured_at),
      ),
    [id],
  )
  const pendientes = useLiveQuery(
    () =>
      db.outbox.toArray().then(
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
  const nombresEtapas = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const etapa of etapas ?? []) mapa.set(etapa.id, etapa.nombre)
    return mapa
  }, [etapas])

  function abrirAvance(etapaId: string | null) {
    setEtapaInicial(etapaId)
    setAvanceAbierto(true)
  }

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
        <p className="mt-2 text-4xl font-extrabold tracking-tight text-navy">
          {avance}%
        </p>
        <Progress value={avance} className="mt-1" />
        <CardDescription className="mt-2">
          Promedio ponderado de {etapas?.length ?? 0} etapas.
        </CardDescription>
        <Button
          size="lg"
          className="mt-4 w-full"
          onClick={() => abrirAvance(null)}
          disabled={!etapas?.length}
        >
          <Plus className="size-5" aria-hidden="true" />
          Registrar avance
        </Button>
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
          Toca una etapa para registrar su avance.
        </CardDescription>
        <ul className="grid gap-2">
          {(etapas ?? []).map((etapa) => (
            <li
              key={etapa.id}
              className="rounded-sm border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-bold text-navy">
                  {etapa.nombre}
                </p>
                <button
                  type="button"
                  onClick={() => abrirAvance(etapa.id)}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-navy/20 bg-white px-3 text-xs font-bold text-navy hover:bg-gray-100"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Avance
                </button>
              </div>
              <Progress value={etapa.porcentaje} className="mt-2" />
              <div className="mt-1.5 flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>{etapa.porcentaje}% completado</span>
                <span>Peso {etapa.peso}%</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-navy" aria-hidden="true" />
          Historial de avance
        </CardTitle>
        <CardDescription className="mb-3">
          Registros guardados, el más reciente primero.
        </CardDescription>

        {avances === undefined ? (
          <div className="h-16 animate-pulse rounded-sm bg-gray-100" />
        ) : avances.length === 0 ? (
          <div className="rounded-sm border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Todavía no hay avances registrados.
          </div>
        ) : (
          <ol className="grid gap-2">
            {avances.map((registro) => (
              <li
                key={registro.id}
                className="rounded-sm border border-gray-100 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy">
                      {nombresEtapas.get(registro.etapa_id) ?? 'Etapa'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatearFecha(registro.captured_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-xs font-extrabold text-success">
                    {registro.porcentaje}%
                  </span>
                </div>
                {registro.nota ? (
                  <p className="mt-2 text-sm text-gray-700">{registro.nota}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
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

      <RegistrarAvanceDialog
        open={avanceAbierto}
        onClose={() => setAvanceAbierto(false)}
        obraId={obra.id}
        etapaInicialId={etapaInicial}
        etapas={etapas ?? []}
      />
    </div>
  )
}
