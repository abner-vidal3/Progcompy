import { useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import MessageBubble from './MessageBubble'

/**
 * Skeleton de carga — simula 3 mensajes placeholder
 */
function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex gap-2.5 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-border)]" />
          <div className={`flex flex-col gap-1.5 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
              <div className="h-2.5 w-8 rounded bg-[var(--color-border)]" />
            </div>
            <div
              className={`h-10 rounded-2xl bg-[var(--color-border)] ${
                i % 2 === 0 ? 'w-40 rounded-tr-md' : 'w-48 rounded-tl-md'
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MessageList({ messages, loading, error, children }) {
  const { user } = useAuth()
  const bottomRef = useRef(null)

  // Scroll automático al último mensaje
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Loading */}
        {loading && <MessageSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Error al cargar mensajes
            </p>
            <p className="text-xs text-[var(--color-text)]/50">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
            <p className="text-sm text-[var(--color-text)]/40">
              No hay mensajes todavia
            </p>
            <p className="text-xs text-[var(--color-text)]/30">
              Se el primero en escribir algo
            </p>
          </div>
        )}

        {/* Messages */}
        {!loading &&
          !error &&
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.user_id === user?.id}
            />
          ))}

        {/* Anchor para scroll automático */}
        <div ref={bottomRef} />
      </div>

      {/* Input area (children) */}
      {children}
    </div>
  )
}
