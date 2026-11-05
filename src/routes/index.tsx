import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Building2, Plus } from 'lucide-react'
import { CrearObraDialog } from '@/components/obras/crear-obra-dialog'
import { ObraCard } from '@/components/obras/obra-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { db, type Etapa } from '@/lib/db'
import { calcularAvance } from '@/lib/obras'

export const Route = createFileRoute('/')({ component: ObrasPage })

function ObrasPage() {
  const navigate = useNavigate()
  const [dialogoAbierto, setDialogoAbierto] = useState(false)

  const obras = useLiveQuery(
    async () =>
      (await db.obras.toArray())
        .filter((obra) => !obra.deleted_at)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [],
  )
  const etapas = useLiveQuery(() => db.etapas.toArray(), [])
  const outbox = useLiveQuery(() => db.outbox.toArray(), [])

  const etapasPorObra = useMemo(() => {
    const mapa = new Map<string, Etapa[]>()
    for (const etapa of etapas ?? []) {
      const lista = mapa.get(etapa.obra_id) ?? []
      lista.push(etapa)
      mapa.set(etapa.obra_id, lista)
    }
    return mapa
  }, [etapas])

  const pendientesPorObra = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const item of outbox ?? []) {
      const obraId =
        item.table === 'obras'
          ? (item.row.id as string)
          : (item.row.obra_id as string | undefined)
      if (!obraId) continue
      mapa.set(obraId, (mapa.get(obraId) ?? 0) + 1)
    }
    return mapa
  }, [outbox])

  const cargando = obras === undefined || etapas === undefined || outbox === undefined

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
        {obras && obras.length > 0 ? (
          <Badge variant="blue">
            {obras.length} {obras.length === 1 ? 'activa' : 'activas'}
          </Badge>
        ) : null}
      </div>

      {cargando ? (
        <div className="grid gap-3" aria-busy="true" aria-live="polite">
          <div className="h-36 animate-pulse rounded-md bg-gray-100" />
          <div className="h-36 animate-pulse rounded-md bg-gray-100" />
        </div>
      ) : obras.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-7" aria-hidden="true" />}
          title="Aún no tienes obras"
          description="Crea tu primera obra para registrar avance, compras e inventario."
          action={
            <Button onClick={() => setDialogoAbierto(true)}>
              <Plus className="size-5" aria-hidden="true" />
              Crear obra
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            {obras.map((obra) => (
              <ObraCard
                key={obra.id}
                obra={obra}
                avance={calcularAvance(etapasPorObra.get(obra.id) ?? [])}
                pendientes={pendientesPorObra.get(obra.id) ?? 0}
              />
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => setDialogoAbierto(true)}
          >
            <Plus className="size-5" aria-hidden="true" />
            Crear otra obra
          </Button>
        </>
      )}

      <CrearObraDialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        onCreated={(obra) => {
          setDialogoAbierto(false)
          void navigate({ to: '/obras/$id', params: { id: obra.id } })
        }}
      />
    </div>
  )
}
