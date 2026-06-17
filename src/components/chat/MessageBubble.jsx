import { FileText } from 'lucide-react'

/**
 * Formatea una fecha ISO a HH:MM (24h)
 */
function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Obtiene la inicial del username para el avatar
 */
function getInitial(username) {
  if (!username) return '?'
  return username.charAt(0).toUpperCase()
}

/**
 * Genera un color de fondo para el avatar basado en el username
 * usando una paleta de colores consistente
 */
function getAvatarColor(username) {
  if (!username) return 'var(--color-primary)'
  // Hash simple del string para elegir un color
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
  ]
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export default function MessageBubble({ message, isOwn }) {
  const username = message.profiles?.username || 'Desconocido'
  const initial = getInitial(username)
  const avatarColor = getAvatarColor(username)
  const time = formatTime(message.created_at)

  return (
    <div
      className={`flex gap-2.5 mb-4 ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
        style={{ backgroundColor: avatarColor }}
        title={username}
      >
        {initial}
      </div>

      {/* Bubble */}
      <div
        className={`flex flex-col max-w-[75%] ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Username + Time */}
        <div
          className={`flex items-center gap-2 mb-1 ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span className="text-xs font-medium text-[var(--color-text)]/80">
            {username}
          </span>
          <span className="text-[10px] text-[var(--color-text)]/40">
            {time}
          </span>
        </div>

        {/* Message content */}
        {message.content && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isOwn
                ? 'bg-[var(--color-primary)] text-white rounded-tr-md'
                : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-tl-md'
            }`}
          >
            {message.content}
          </div>
        )}

        {/* File attachment */}
        {message.file_path && (
          <a
            href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-files/${message.file_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isOwn
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-text)] hover:bg-[var(--color-primary)]/30'
                : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]'
            } ${message.content ? 'mt-1.5' : ''}`}
          >
            <FileText size={16} className="shrink-0" />
            <span className="truncate max-w-[200px]">
              {message.file_name || 'Archivo adjunto'}
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
