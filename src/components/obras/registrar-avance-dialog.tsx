import { useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/input'
import type { Etapa } from '@/lib/db'
import {
  calcularAvance,
  registrarAvance,
  validarPorcentaje,
} from '@/lib/obras'

const atajos = [25, 50, 75, 100]

export function RegistrarAvanceDialog({
  open,
  onClose,
  obraId,
  etapaInicialId,
  etapas,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  obraId: string
  etapaInicialId: string | null
  etapas: Etapa[]
  onSaved?: () => void
}) {
  const [etapaId, setEtapaId] = useState('')
  const [porcentaje, setPorcentaje] = useState(0)
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    const inicial =
      etapas.find((etapa) => etapa.id === etapaInicialId) ?? etapas[0]
    setEtapaId(inicial?.id ?? '')
    setPorcentaje(inicial?.porcentaje ?? 0)
    setNota('')
    setError(null)
    setGuardando(false)
    // Solo al abrir: no se reinicia mientras el usuario edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, etapaInicialId])

  function cambiarEtapa(id: string) {
    setEtapaId(id)
    const etapa = etapas.find((item) => item.id === id)
    setPorcentaje(etapa?.porcentaje ?? 0)
  }

  const avanceProyectado = useMemo(() => {
    const proyectadas = etapas.map((etapa) =>
      etapa.id === etapaId ? { ...etapa, porcentaje } : etapa,
    )
    return calcularAvance(proyectadas)
  }, [etapas, etapaId, porcentaje])

  async function guardar() {
    if (!etapaId) {
      setError('Selecciona una etapa.')
      return
    }
    const mensaje = validarPorcentaje(porcentaje)
    if (mensaje) {
      setError(mensaje)
      return
    }

    setGuardando(true)
    try {
      await registrarAvance({ obraId, etapaId, porcentaje, nota })
      onSaved?.()
      onClose()
    } catch {
      setError('No se pudo guardar el avance en este dispositivo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={guardando ? () => undefined : onClose}
      title="Registrar avance"
      description="El avance queda en el historial de la obra."
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
            disabled={guardando || etapas.length === 0}
          >
            {guardando ? 'Guardando…' : 'Guardar avance'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <Field label="Etapa" htmlFor="avance-etapa">
          <select
            id="avance-etapa"
            className="h-12 w-full rounded-sm border border-gray-300 bg-white px-3 text-base font-semibold text-ink focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
            value={etapaId}
            onChange={(event) => cambiarEtapa(event.target.value)}
          >
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nombre} · {etapa.porcentaje}%
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-2">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs font-bold text-gray-700">
              Porcentaje de la etapa
            </span>
            <span className="text-3xl font-extrabold tracking-tight text-navy">
              {porcentaje}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={porcentaje}
            onChange={(event) => setPorcentaje(Number(event.target.value))}
            aria-label="Porcentaje de avance de la etapa"
            className="h-12 w-full accent-orange"
          />
          <div className="flex flex-wrap gap-2">
            {atajos.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => setPorcentaje(valor)}
                className={
                  'min-h-10 rounded-full border px-3 text-xs font-bold ' +
                  (porcentaje === valor
                    ? 'border-orange bg-orange-soft text-orange-ink'
                    : 'border-gray-300 bg-white text-gray-700')
                }
              >
                {valor}%
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-sm bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
            <span>Avance general de la obra</span>
            <span className="text-navy">{avanceProyectado}%</span>
          </div>
        </div>

        <Field
          label="Nota"
          htmlFor="avance-nota"
          hint="Opcional: qué trabajo se completó."
        >
          <textarea
            id="avance-nota"
            rows={3}
            className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-gray-500 focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
            placeholder="Ej.: fundida de zapatas terminada."
            value={nota}
            onChange={(event) => setNota(event.target.value)}
          />
        </Field>

        {error ? <Alert variant="danger" title={error} /> : null}
      </div>
    </Dialog>
  )
}
