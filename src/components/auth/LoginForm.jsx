import { useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Revisa tu email y contraseña.'
          : err.message || 'Error al iniciar sesión.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text)]/30 transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          placeholder="tu@email.com"
          disabled={submitting}
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text)]/30 transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          placeholder="Tu contraseña"
          disabled={submitting}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </>
        )}
      </button>

      {onSwitchToRegister && (
        <p className="text-center text-sm text-[var(--color-text)]/70">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
          >
            Regístrate
          </button>
        </p>
      )}
    </form>
  )
}
