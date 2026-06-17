import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Code2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()

  // While checking session, show nothing
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    )
  }

  // Already authenticated — redirect to rooms
  if (user) {
    return <Navigate to="/rooms" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <Code2 className="h-10 w-10 text-[var(--color-primary)]" />
            <h1 className="text-3xl font-bold text-[var(--color-text)]">
              Progcompy
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text)]/60">
            Apuntes colaborativos para programación competitiva.
            <br />
            Organiza problemas, comparte soluciones y aprende en equipo.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          {/* Tabs */}
          <div className="mb-6 flex border-b border-[var(--color-border)]">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                isLogin
                  ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text)]/50 hover:text-[var(--color-text)]'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                !isLogin
                  ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text)]/50 hover:text-[var(--color-text)]'
              }`}
            >
              Registrarse
            </button>
          </div>

          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[var(--color-text)]/40">
          Progcompy &mdash; Comparte conocimiento, resuelve problemas.
        </p>
      </div>
    </div>
  )
}
