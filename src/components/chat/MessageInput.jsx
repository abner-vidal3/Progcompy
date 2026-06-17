import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Paperclip, Loader2 } from 'lucide-react'

const ALLOWED_EXTENSIONS = '.cpp,.py,.java,.js,.ts,.c,.h,.txt,.md'
const MAX_ROWS = 4
const MIN_ROWS = 1

export default function MessageInput({ onSend, onUpload, loading }) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const isDisabled = loading || uploading

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return

    // Resetear altura para medir correctamente
    el.style.height = 'auto'

    // Calcular altura basada en el scrollHeight
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
    const maxHeight = lineHeight * MAX_ROWS + parseFloat(getComputedStyle(el).paddingTop) + parseFloat(getComputedStyle(el).paddingBottom)
    const newHeight = Math.min(el.scrollHeight, maxHeight)

    el.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [text, adjustHeight])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || isDisabled) return

    try {
      await onSend(trimmed)
      setText('')
      // Resetear altura
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (_err) {
      // Error se maneja en useChat
    }
  }, [text, isDisabled, onSend])

  const handleKeyDown = useCallback(
    (e) => {
      // Enter sin Shift → enviar
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      // Shift+Enter → nueva línea (comportamiento por defecto de textarea)
    },
    [handleSend],
  )

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        await onUpload(file)
      } catch (_err) {
        // Error se maneja en useChat
      } finally {
        setUploading(false)
        // Limpiar el input file para permitir re-subir el mismo archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [onUpload],
  )

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-end gap-2">
        {/* File upload button + hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Adjuntar archivo"
        />
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={isDisabled}
          className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[var(--color-text)]/50 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Adjuntar archivo"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={MIN_ROWS}
          disabled={isDisabled}
          placeholder="Escribe un mensaje..."
          className="flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed max-h-[120px]"
          style={{ lineHeight: '1.5' }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled || !text.trim()}
          className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Enviar mensaje"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
