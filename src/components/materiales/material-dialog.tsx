import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import type { Material } from '@/lib/db'
import {
  UNIDADES,
  actualizarMaterial,
  crearMaterial,
  eliminarMaterial,
  validarMaterial,
} from '@/lib/materiales'

export function MaterialDialog({
  open,
  onClose,
  material,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  material: Material | null
  onSaved?: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [unidad, setUnidad] = useState(UNIDADES[0])
  const [stockMinimo, setStockMinimo] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  useEffect(() => {
    if (!open) return
    setNombre(material?.nombre ?? '')
    setCategoria(material?.categoria ?? '')
    setUnidad(material?.unidad ?? UNIDADES[0])
    setStockMinimo(String(material?.stock_minimo ?? 0))
    setError(null)
    setGuardando(false)
    setConfirmandoBorrado(false)
  }, [open, material])

  async function guardar() {
    const input = {
      nombre,
      unidad,
      categoria,
      stock_minimo: Number(stockMinimo) || 0,
    }
    const mensaje = validarMaterial(input)
    if (mensaje) {
      setError(mensaje)
      return
    }

    setGuardando(true)
    try {
      if (material) {
        await actualizarMaterial(material.id, input)
      } else {
        await crearMaterial(input)
      }
      onSaved?.()
      onClose()
    } catch {
      setError('No se pudo guardar el material en este dispositivo.')
    } finally {
      setGuardando(false)
    }
  }

  async function borrar() {
    if (!material) return
    setGuardando(true)
    try {
      await eliminarMaterial(material.id)
      onSaved?.()
      onClose()
    } catch {
      setError('No se pudo eliminar el material.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={guardando ? () => undefined : onClose}
      title={material ? 'Editar material' : 'Nuevo material'}
      description="El catálogo se reutiliza entre todas tus obras."
      footer={
        <div className="flex gap-2">
          {material ? (
            <Button
              variant="ghost"
              className="px-4 text-danger"
              onClick={() => setConfirmandoBorrado(true)}
              disabled={guardando}
              aria-label="Eliminar material"
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={() => void guardar()}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      }
    >
      {confirmandoBorrado ? (
        <div className="grid gap-3">
          <Alert variant="danger" title="¿Eliminar este material?">
            Dejará de aparecer en el catálogo. Los consumos ya registrados se
            conservan.
          </Alert>
          <Button
            variant="danger"
            onClick={() => void borrar()}
            disabled={guardando}
          >
            Sí, eliminar material
          </Button>
          <Button
            variant="ghost"
            onClick={() => setConfirmandoBorrado(false)}
            disabled={guardando}
          >
            No, volver
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <Field label="Nombre *" htmlFor="material-nombre" error={error ?? undefined}>
            <Input
              id="material-nombre"
              placeholder="Cemento"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </Field>

          <Field label="Categoría" htmlFor="material-categoria">
            <Input
              id="material-categoria"
              placeholder="Albañilería, estructura, acabados…"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unidad *" htmlFor="material-unidad">
              <select
                id="material-unidad"
                className="h-12 w-full rounded-sm border border-gray-300 bg-white px-3 text-base font-semibold text-ink focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
                value={unidad}
                onChange={(event) => setUnidad(event.target.value)}
              >
                {UNIDADES.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Stock mínimo"
              htmlFor="material-stock"
              hint="Alerta al reponer."
            >
              <Input
                id="material-stock"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.001"
                value={stockMinimo}
                onChange={(event) => setStockMinimo(event.target.value)}
              />
            </Field>
          </div>
        </div>
      )}
    </Dialog>
  )
}
