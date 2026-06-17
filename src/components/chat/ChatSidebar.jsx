import { useState, useEffect } from 'react'
import { MessageCircle, MessageSquare, X } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChatSidebar({ roomId }) {
  const [isOpen, setIsOpen] = useState(false)

  const {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    uploadFile,
  } = useChat(roomId)

  // Set initial state based on screen size: open on desktop, closed on mobile
  useEffect(() => {
    const checkScreen = () => {
      setIsOpen(window.innerWidth >= 768)
    }

    checkScreen()

    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  return (
    <>
      {/* Mobile toggle button — fixed at bottom-right */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="md:hidden fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-30 border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col transition-all duration-300 ease-in-out md:relative md:w-80 md:h-full ${
          isOpen
            ? 'w-80'
            : 'w-0 overflow-hidden md:w-80'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] shrink-0">
          <MessageSquare size={20} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Chat</h2>
        </div>

        {/* Messages + Input */}
        <MessageList messages={messages} loading={loading} error={error}>
          <MessageInput
            onSend={sendMessage}
            onUpload={uploadFile}
            loading={sending}
          />
        </MessageList>
      </aside>
    </>
  )
}
