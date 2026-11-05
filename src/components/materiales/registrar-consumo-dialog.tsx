import { useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import type { Etapa, Material } from '@/lib/db'
import { registrarConsumo, validarConsumo } from '@/lib/materiales'

export function RegistrarConsumoDialog({
  open,
  onClose,
  obraId,
  materiales,
  etapas,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  obraId: string
  materiales: Material[]
  etapas: Etapa[]
  onSaved?: () => void
}) {
  const [materialId, setMaterialId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [etapaId, setEtapaId] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const material = useMemo(
    () => materiales.find((item) => item.id === materialId),
    [materiales, materialId],
  )

  useEffect(() => {
    if (!open) return
    setMaterialId(materiales[0]?.id ?? '')
    setCantidad('1')
    setEtapaId('')
    setNota('')
    setError(null)
    setGuardando(false)
    // Solo al abrir: no reiniciar mientras el usuario escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function guardar() {
    const valor = Number(cantidad.replace(',', '.'))
    const mensaje = validarConsumo(valor)
    if (!materialId || !material) {
      setError('Selecciona un material del catálogo.')
      return
    }
    if (mensaje) {
      setError(mensaje)
      return
    }

    setGuardando(true)
    try {
      await registrarConsumo({
        obraId,
        materialId,
        etapaId: etapaId || null,
        cantidad: valor,
        nota,
      })
      onSaved?.()
      onClose()
    } catch {
      setError('No se pudo guardar el consumo en este dispositivo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={guardando ? () => undefined : onClose}
      title="Usé material"
      description="Descuenta material del inventario de la obra."
      footer={
        <div className="flex gap-2">
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
            disabled={guardando || materiales.length === 0}
          >
            {guardando ? 'Guardando…' : 'Registrar consumo'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <Field label="Material *" htmlFor="consumo-material">
          <select
            id="consumo-material"
            className="h-12 w-full rounded-sm border border-gray-300 bg-white px-3 text-base font-semibold text-ink focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
            value={materialId}
            onChange={(event) => setMaterialId(event.target.value)}
          >
            {materiales.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre} ({item.unidad})
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={`Cantidad${material ? ` (${material.unidad})` : ''}`}
          htmlFor="consumo-cantidad"
          hint={
            material && material.stock_minimo > 0
              ? `Stock mínimo: ${material.stock_minimo} ${material.unidad}.`
              : undefined
          }
        >
          <Input
            id="consumo-cantidad"
            type="number"
            inputMode="decimal"
            min="0.001"
            step="0.001"
            value={cantidad}
            onChange={(event) => setCantidad(event.target.value)}
          />
        </Field>

        <Field
          label="Etapa"
          htmlFor="consumo-etapa"
          hint="Opcional: a qué etapa se destinó."
        >
          <select
            id="consumo-etapa"
            className="h-12 w-full rounded-sm border border-gray-300 bg-white px-3 text-base text-ink focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
            value={etapaId}
            onChange={(event) => setEtapaId(event.target.value)}
          >
            <option value="">Sin etapa</option>
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nombre}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Nota"
          htmlFor="consumo-nota"
          hint="Opcional: para qué se usó."
        >
          <textarea
            id="consumo-nota"
            rows={3}
            className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-gray-500 focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
            placeholder="Ej.: pañete de la fachada."
            value={nota}
            onChange={(event) => setNota(event.target.value)}
          />
        </Field>

        {error ? <Alert variant="danger" title={error} /> : null}
      </div>
    </Dialog>
  )
}
