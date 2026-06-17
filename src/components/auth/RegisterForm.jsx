import { useState } from 'react'
import { Loader2, UserPlus, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio.'
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'El formato del email no es válido.'
    }

    if (!username.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio.'
    } else if (username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres.'
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.'
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña.'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await register(email, password, username.trim())
      setSuccess(true)
    } catch (err) {
      setServerError(
        err.message || 'Error al registrarse. Inténtalo de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (fieldName) =>
    `w-full rounded-md border px-3.5 py-2.5 text-sm text-[var(--color-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 ${
      errors[fieldName]
        ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950'
        : 'border-[var(--color-border)] bg-[var(--color-surface)] focus:border-[var(--color-primary)]'
    } placeholder-[var(--color-text)]/30`

  return (
    <>
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              ¡Cuenta creada!
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text)]/60">
              Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
          >
            Ir a iniciar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {serverError}
            </div>
          )}

      <div>
        <label
          htmlFor="register-email"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
          }}
          className={fieldClass('email')}
          placeholder="tu@email.com"
          disabled={submitting}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-username"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Nombre de usuario
        </label>
        <input
          id="register-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            if (errors.username) setErrors((prev) => ({ ...prev, username: '' }))
          }}
          className={fieldClass('username')}
          placeholder="usuario123"
          disabled={submitting}
        />
        {errors.username && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.username}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-password"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Contraseña
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
          }}
          className={fieldClass('password')}
          placeholder="Mínimo 6 caracteres"
          disabled={submitting}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-confirm-password"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Confirmar contraseña
        </label>
        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (errors.confirmPassword)
              setErrors((prev) => ({ ...prev, confirmPassword: '' }))
          }}
          className={fieldClass('confirmPassword')}
          placeholder="Repite tu contraseña"
          disabled={submitting}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Crear cuenta
          </>
        )}
      </button>

          {onSwitchToLogin && (
            <p className="text-center text-sm text-[var(--color-text)]/70">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </form>
      )}
    </>
  )
}
