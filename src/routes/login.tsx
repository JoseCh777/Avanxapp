import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!phone.trim() || !password) {
      setError('Escribe tu teléfono y tu contraseña.')
      return
    }
    setError(null)
    // TODO(F4): autenticación real contra Supabase Auth.
    void navigate({ to: '/' })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 grid gap-2">
        <Logo className="text-3xl" />
        <p className="text-sm text-gray-500">
          Tecnología que avanza contigo.
        </p>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-navy">
        Entrar a tu cuenta
      </h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Usa el teléfono con el que te registró el administrador.
      </p>

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <Field label="Teléfono" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="300 000 0000"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              className="pr-12"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gray-500"
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {error ? <Alert variant="danger" title={error} /> : null}

        <Button type="submit" size="lg">
          <LogIn className="size-5" aria-hidden="true" />
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        ¿No puedes entrar? Pídele al administrador que restablezca tu
        contraseña.
      </p>
    </div>
  )
}
