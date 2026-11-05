import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'

export const Route = createFileRoute('/cambiar-clave')({
  component: CambiarClavePage,
})

function CambiarClavePage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    // TODO(F4): cambio de contraseña real contra Supabase Auth.
    void navigate({ to: '/' })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Logo className="mb-8 text-3xl" />

      <h1 className="text-2xl font-extrabold tracking-tight text-navy">
        Cambia tu contraseña
      </h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Es tu primer ingreso. Elige una contraseña nueva para continuar.
      </p>

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <Field
          label="Contraseña nueva"
          htmlFor="new-password"
          hint="Mínimo 8 caracteres."
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Field label="Repite la contraseña" htmlFor="confirm-password">
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </Field>

        {error ? <Alert variant="danger" title={error} /> : null}

        <Button type="submit" size="lg">
          <KeyRound className="size-5" aria-hidden="true" />
          Guardar y continuar
        </Button>
      </form>
    </div>
  )
}
