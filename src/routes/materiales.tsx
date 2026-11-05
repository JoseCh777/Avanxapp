import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Package, Pencil, Plus, Search, Sparkles } from 'lucide-react'
import { MaterialDialog } from '@/components/materiales/material-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { db, type Material } from '@/lib/db'
import { cargarCatalogoSugerido } from '@/lib/materiales'

export const Route = createFileRoute('/materiales')({
  component: MaterialesPage,
})

function MaterialesPage() {
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false)

  const materiales = useLiveQuery(
    async () =>
      (await db.materiales.toArray())
        .filter((material) => !material.deleted_at)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [],
  )

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return materiales ?? []
    return (materiales ?? []).filter((material) =>
      `${material.nombre} ${material.categoria}`
        .toLowerCase()
        .includes(termino),
    )
  }, [materiales, busqueda])

  function abrirNuevo() {
    setMaterialEditando(null)
    setDialogoAbierto(true)
  }

  function abrirEdicion(material: Material) {
    setMaterialEditando(material)
    setDialogoAbierto(true)
  }

  async function cargarSugerido() {
    setCargandoCatalogo(true)
    try {
      await cargarCatalogoSugerido()
    } finally {
      setCargandoCatalogo(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[2px] text-orange uppercase">
            Catálogo
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">
            Materiales
          </h1>
        </div>
        {materiales && materiales.length > 0 ? (
          <Badge variant="blue">{materiales.length} materiales</Badge>
        ) : null}
      </div>

      {materiales && materiales.length > 0 ? (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <Input
              className="pl-10"
              placeholder="Buscar material…"
              aria-label="Buscar material"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          {filtrados.length === 0 ? (
            <p className="rounded-sm border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
              No hay materiales que coincidan con «{busqueda}».
            </p>
          ) : (
            <ul className="grid gap-2">
              {filtrados.map((material) => (
                <li
                  key={material.id}
                  className="flex items-center gap-3 rounded-md border border-gray-100 bg-white p-3 shadow-soft"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-navy/5 text-navy">
                    <Package className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy">
                      {material.nombre}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {material.categoria || 'Sin categoría'} ·{' '}
                      {material.unidad}
                    </p>
                  </div>
                  {material.stock_minimo > 0 ? (
                    <Badge variant="gray">
                      Mín. {material.stock_minimo} {material.unidad}
                    </Badge>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => abrirEdicion(material)}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-navy"
                    aria-label={`Editar ${material.nombre}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button size="lg" className="w-full" onClick={abrirNuevo}>
            <Plus className="size-5" aria-hidden="true" />
            Nuevo material
          </Button>
        </>
      ) : materiales === undefined ? (
        <div className="grid gap-2" aria-busy="true" aria-live="polite">
          <div className="h-16 animate-pulse rounded-md bg-gray-100" />
          <div className="h-16 animate-pulse rounded-md bg-gray-100" />
        </div>
      ) : (
        <EmptyState
          icon={<Package className="size-7" aria-hidden="true" />}
          title="Sin materiales todavía"
          description="Crea tu catálogo o carga los materiales más usados en obra."
          action={
            <div className="grid w-full max-w-xs gap-2">
              <Button onClick={abrirNuevo}>
                <Plus className="size-5" aria-hidden="true" />
                Crear material
              </Button>
              <Button
                variant="outline"
                onClick={() => void cargarSugerido()}
                disabled={cargandoCatalogo}
              >
                <Sparkles className="size-5" aria-hidden="true" />
                {cargandoCatalogo
                  ? 'Cargando…'
                  : 'Cargar catálogo sugerido'}
              </Button>
            </div>
          }
        />
      )}

      <MaterialDialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        material={materialEditando}
      />
    </div>
  )
}
