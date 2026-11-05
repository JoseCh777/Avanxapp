import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import type { Obra } from '@/lib/db'
import {
  ETAPAS_PLANTILLA,
  crearObra,
  normalizarTelefono,
  validarNuevaObra,
  type EtapaPlantilla,
} from '@/lib/obras'

interface EtapaEditable extends EtapaPlantilla {
  key: string
}

let etapaKey = 0

function nuevaEtapa(nombre = '', peso = 0): EtapaEditable {
  etapaKey += 1
  return { key: `etapa-${etapaKey}`, nombre, peso }
}

export function CrearObraDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (obra: Obra) => void
}) {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [nombre, setNombre] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [notas, setNotas] = useState('')
  const [etapas, setEtapas] = useState<EtapaEditable[]>(() =>
    ETAPAS_PLANTILLA.map((etapa) => nuevaEtapa(etapa.nombre, etapa.peso)),
  )
  const [nuevaEtapaNombre, setNuevaEtapaNombre] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (open) {
      setPaso(1)
      setNombre('')
      setClienteNombre('')
      setClienteTelefono('')
      setDireccion('')
      setNotas('')
      setEtapas(
        ETAPAS_PLANTILLA.map((etapa) => nuevaEtapa(etapa.nombre, etapa.peso)),
      )
      setNuevaEtapaNombre('')
      setErrores({})
      setGuardando(false)
    }
  }, [open])

  const pesoTotal = useMemo(
    () => etapas.reduce((sum, etapa) => sum + (Number(etapa.peso) || 0), 0),
    [etapas],
  )

  const activas = etapas.filter((etapa) => etapa.nombre.trim())

  function actualizarPeso(key: string, valor: string) {
    const peso = Number(valor.replace(',', '.'))
    setEtapas((actuales) =>
      actuales.map((etapa) =>
        etapa.key === key
          ? { ...etapa, peso: Number.isFinite(peso) ? peso : 0 }
          : etapa,
      ),
    )
  }

  function actualizarNombre(key: string, valor: string) {
    setEtapas((actuales) =>
      actuales.map((etapa) =>
        etapa.key === key ? { ...etapa, nombre: valor } : etapa,
      ),
    )
  }

  function quitarEtapa(key: string) {
    setEtapas((actuales) => actuales.filter((etapa) => etapa.key !== key))
  }

  function agregarEtapa() {
    const nombre = nuevaEtapaNombre.trim()
    if (!nombre) return
    setEtapas((actuales) => [...actuales, nuevaEtapa(nombre, 0)])
    setNuevaEtapaNombre('')
  }

  function distribuirParejo() {
    if (activas.length === 0) return
    const peso = Math.floor((100 / activas.length) * 10) / 10
    const sobrante = Math.round((100 - peso * activas.length) * 10) / 10
    setEtapas((actuales) =>
      actuales.map((etapa) => {
        const indice = activas.findIndex((item) => item.key === etapa.key)
        if (indice === -1) return { ...etapa, peso: 0 }
        return {
          ...etapa,
          peso: indice === 0 ? Math.round((peso + sobrante) * 10) / 10 : peso,
        }
      }),
    )
  }

  function validarPasoUno(): boolean {
    const mensajes: Record<string, string> = {}
    if (nombre.trim().length < 2) {
      mensajes.nombre = 'Escribe un nombre de al menos 2 caracteres.'
    }
    if (clienteTelefono.trim() && !normalizarTelefono(clienteTelefono)) {
      mensajes.cliente_telefono =
        'Escribe un teléfono colombiano válido (10 dígitos).'
    }
    setErrores(mensajes)
    return Object.keys(mensajes).length === 0
  }

  function irAPasoDos() {
    if (validarPasoUno()) setPaso(2)
  }

  async function guardar() {
    const erroresValidacion = validarNuevaObra({
      nombre,
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
      direccion,
      notas,
      etapas,
    })
    if (erroresValidacion.length > 0) {
      setErrores(
        Object.fromEntries(
          erroresValidacion.map((error) => [error.campo, error.mensaje]),
        ),
      )
      return
    }

    setGuardando(true)
    try {
      const obra = await crearObra({
        nombre,
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        direccion,
        notas,
        etapas,
      })
      onCreated(obra)
    } catch {
      setErrores({
        general: 'No se pudo guardar la obra en este dispositivo. Intenta de nuevo.',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={guardando ? () => undefined : onClose}
      title="Nueva obra"
      description={
        paso === 1
          ? 'Paso 1 de 2 · Datos de la obra'
          : 'Paso 2 de 2 · Etapas y pesos'
      }
      footer={
        <div className="flex gap-2">
          {paso === 2 ? (
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setPaso(1)}
              disabled={guardando}
            >
              Atrás
            </Button>
          ) : null}
          {paso === 1 ? (
            <Button className="flex-1" onClick={irAPasoDos}>
              Continuar
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => void guardar()}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Crear obra'}
            </Button>
          )}
        </div>
      }
    >
      {paso === 1 ? (
        <div className="grid gap-4">
          <Field
            label="Nombre de la obra *"
            htmlFor="obra-nombre"
            error={errores.nombre}
          >
            <Input
              id="obra-nombre"
              placeholder="Casa Gómez"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              aria-invalid={Boolean(errores.nombre)}
            />
          </Field>

          <Field label="Cliente" htmlFor="obra-cliente">
            <Input
              id="obra-cliente"
              placeholder="Ana Gómez"
              value={clienteNombre}
              onChange={(event) => setClienteNombre(event.target.value)}
            />
          </Field>

          <Field
            label="Teléfono del cliente"
            htmlFor="obra-telefono"
            hint="Se usa para compartir el avance por WhatsApp."
            error={errores.cliente_telefono}
          >
            <Input
              id="obra-telefono"
              type="tel"
              inputMode="tel"
              placeholder="300 123 4567"
              value={clienteTelefono}
              onChange={(event) => setClienteTelefono(event.target.value)}
              aria-invalid={Boolean(errores.cliente_telefono)}
            />
          </Field>

          <Field label="Dirección" htmlFor="obra-direccion">
            <Input
              id="obra-direccion"
              placeholder="Cra 5 #10-20, Bogotá"
              value={direccion}
              onChange={(event) => setDireccion(event.target.value)}
            />
          </Field>

          <Field
            label="Notas"
            htmlFor="obra-notas"
            hint="Opcional: observaciones generales de la obra."
          >
            <textarea
              id="obra-notas"
              rows={3}
              className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-gray-500 focus:border-orange focus:ring-4 focus:ring-orange/15 focus:outline-none"
              placeholder="Ej.: segunda planta, entrega en diciembre…"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
            />
          </Field>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-gray-700">
                Etapas de la plantilla
              </p>
              <Button
                variant="ghost"
                className="h-10 px-3 text-xs"
                onClick={distribuirParejo}
              >
                Distribuir parejo
              </Button>
            </div>

            <ul className="grid gap-2">
              {etapas.map((etapa) => (
                <li
                  key={etapa.key}
                  className="grid gap-2 rounded-sm border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        'grid size-6 shrink-0 place-items-center rounded-full ' +
                        (etapa.nombre.trim()
                          ? 'bg-success-soft text-success'
                          : 'bg-gray-100 text-gray-500')
                      }
                      aria-hidden="true"
                    >
                      <Check className="size-4" />
                    </span>
                    <input
                      aria-label={`Nombre de la etapa ${etapa.nombre}`}
                      className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-navy focus:border-gray-300 focus:bg-white focus:outline-none"
                      value={etapa.nombre}
                      onChange={(event) =>
                        actualizarNombre(etapa.key, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => quitarEtapa(etapa.key)}
                      className="grid size-11 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-danger-soft hover:text-danger"
                      aria-label={`Quitar ${etapa.nombre || 'etapa'}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-gray-500">
                      Peso
                    </span>
                    <input
                      aria-label={`Peso de ${etapa.nombre}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={0.5}
                      className="h-11 w-20 rounded-sm border border-gray-300 bg-white px-2 text-right text-sm font-bold text-navy focus:border-orange focus:outline-none"
                      value={etapa.peso}
                      onChange={(event) =>
                        actualizarPeso(etapa.key, event.target.value)
                      }
                    />
                    <span className="text-xs font-bold text-gray-500">%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Input
              aria-label="Nombre de la etapa nueva"
              placeholder="Agregar etapa propia"
              value={nuevaEtapaNombre}
              onChange={(event) => setNuevaEtapaNombre(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  agregarEtapa()
                }
              }}
            />
            <Button
              variant="outline"
              onClick={agregarEtapa}
              disabled={!nuevaEtapaNombre.trim()}
              aria-label="Agregar etapa"
            >
              <Plus className="size-5" aria-hidden="true" />
            </Button>
          </div>

          <div
            className={
              'flex items-center justify-between rounded-sm px-3 py-2 text-sm font-bold ' +
              (Math.abs(pesoTotal - 100) < 0.01
                ? 'bg-success-soft text-success'
                : 'bg-warning-soft text-warning')
            }
          >
            <span>Peso total</span>
            <span>{Math.round(pesoTotal * 10) / 10}%</span>
          </div>

          {errores.etapas ? (
            <Alert variant="danger" title={errores.etapas} />
          ) : null}
          {errores.general ? (
            <Alert variant="danger" title={errores.general} />
          ) : null}

          <p className="text-xs text-gray-500">
            El avance total de la obra será el promedio ponderado de estas
            etapas. Puedes editarlas después.
          </p>
        </div>
      )}
    </Dialog>
  )
}
