import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const MESSAGES_LIMIT = 50

export function useChat(roomId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const channelRef = useRef(null)

  const fetchMessages = useCallback(async () => {
    if (!roomId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('id, content, file_path, file_name, created_at, user_id, profiles(username)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_LIMIT)

      if (fetchError) throw fetchError

      // Invertir para orden cronológico (más antiguo primero)
      const ordered = (data || []).reverse()
      setMessages(ordered)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  // Cargar mensajes al montar
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Suscripción Realtime
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new
          // Obtener el username del perfil
          supabase
            .from('profiles')
            .select('username')
            .eq('id', newMsg.user_id)
            .single()
            .then(({ data: profileData }) => {
              const message = {
                id: newMsg.id,
                content: newMsg.content,
                file_path: newMsg.file_path,
                file_name: newMsg.file_name,
                created_at: newMsg.created_at,
                user_id: newMsg.user_id,
                profiles: profileData ? { username: profileData.username } : { username: 'Desconocido' },
              }
              setMessages((prev) => {
                // Evitar duplicados (si ya tenemos el mensaje, no lo agregamos de nuevo)
                if (prev.some((m) => m.id === message.id)) return prev
                return [...prev, message]
              })
            })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError('Error al conectar con el chat en tiempo real')
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const sendMessage = useCallback(
    async (content) => {
      if (!user || !roomId) throw new Error('No puedes enviar mensajes en este momento')
      if (!content || !content.trim()) throw new Error('El mensaje no puede estar vacío')

      setError(null)
      setSending(true)

      try {
        const { error: insertError } = await supabase.from('chat_messages').insert({
          room_id: roomId,
          user_id: user.id,
          content: content.trim(),
        })

        if (insertError) throw insertError
        // El mensaje se agregará al state vía Realtime
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setSending(false)
      }
    },
    [user, roomId],
  )

  const uploadFile = useCallback(
    async (file) => {
      if (!user || !roomId) throw new Error('No puedes subir archivos en este momento')
      if (!file) throw new Error('No se seleccionó ningún archivo')

      setError(null)
      setSending(true)

      try {
        const timestamp = Date.now()
        const filePath = `${roomId}/${user.id}/${timestamp}_${file.name}`

        // Subir a Storage
        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Insertar mensaje con referencia al archivo
        const { error: insertError } = await supabase.from('chat_messages').insert({
          room_id: roomId,
          user_id: user.id,
          content: '',
          file_path: filePath,
          file_name: file.name,
        })

        if (insertError) throw insertError
        // El mensaje se agregará al state vía Realtime
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setSending(false)
      }
    },
    [user, roomId],
  )

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    uploadFile,
    fetchMessages,
  }
}
