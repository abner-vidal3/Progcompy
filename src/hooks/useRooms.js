import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function useRooms() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRooms = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('room_members')
        .select('role, rooms(*, creator:creator_id(username))')
        .eq('user_id', user.id)
        .is('left_at', null)
        .order('updated_at', { foreignTable: 'rooms', ascending: false })

      if (fetchError) throw fetchError

      const activeRooms = (data || [])
        .filter((item) => item.rooms && !item.rooms.is_deleted)
        .map((item) => ({
          id: item.rooms.id,
          code: item.rooms.code,
          name: item.rooms.name,
          creator_id: item.rooms.creator_id,
          creator_username: item.rooms.creator?.username ?? 'Desconocido',
          member_limit: item.rooms.member_limit,
          is_deleted: item.rooms.is_deleted,
          created_at: item.rooms.created_at,
          updated_at: item.rooms.updated_at,
          role: item.role,
        }))

      setRooms(activeRooms)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const createRoom = useCallback(
    async (name, memberLimit) => {
      if (!user) throw new Error('Debes iniciar sesion para crear una sala')

      setError(null)

      for (let attempt = 0; attempt < 3; attempt++) {
        const code = generateRoomCode()

        // Usar RPC (SECURITY DEFINER) para crear sala + membresía atómicamente
        const { data: roomData, error: rpcError } = await supabase.rpc(
          'create_room',
          {
            room_name: name,
            room_code: code,
            room_member_limit: memberLimit ?? null,
          }
        )

        if (rpcError) {
          if (rpcError.message?.includes('duplicate key') || rpcError.code === '23505') {
            continue
          }
          setError(rpcError.message)
          throw rpcError
        }

        const newRoom = {
          ...roomData,
          creator_username: 'Yo',
          is_deleted: false,
          role: 'creator',
        }

        setRooms((prev) => [newRoom, ...prev])
        return newRoom
      }

      const err = new Error('No se pudo generar un codigo unico. Intenta de nuevo.')
      setError(err.message)
      throw err
    },
    [user],
  )

  const joinRoom = useCallback(
    async (code) => {
      if (!user) throw new Error('Debes iniciar sesion para unirte a una sala')

      setError(null)

      // Buscar sala por código (RPC, no requiere membresía)
      const { data: roomData, error: lookupError } = await supabase.rpc(
        'lookup_room_by_code',
        { room_code: code.toUpperCase() }
      )

      if (lookupError || !roomData) {
        const err = new Error('Sala no encontrada o codigo invalido')
        setError(err.message)
        throw err
      }

      // Verificar membresía existente
      const { data: existingMembership } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .is('left_at', null)
        .maybeSingle()

      if (existingMembership) {
        const err = new Error('Ya eres miembro de esta sala')
        setError(err.message)
        throw err
      }

      // Unirse vía RPC (maneja límite de miembros)
      const { error: joinError } = await supabase.rpc(
        'join_room',
        { room_uuid: roomData.id }
      )

      if (joinError) {
        setError(joinError.message)
        throw joinError
      }

      const newRoom = {
        ...roomData,
        creator_username: 'Desconocido',
        is_deleted: false,
        role: 'member',
      }

      setRooms((prev) => [newRoom, ...prev])
      return newRoom
    },
    [user],
  )

  const deleteRoom = useCallback(
    async (id) => {
      if (!user) throw new Error('Debes iniciar sesion para eliminar una sala')

      setError(null)

      // Find the room in local state to check role
      const room = rooms.find((r) => r.id === id)
      if (!room) {
        const err = new Error('Sala no encontrada')
        setError(err.message)
        throw err
      }

      if (room.role !== 'creator') {
        const err = new Error('Solo el creador puede eliminar la sala')
        setError(err.message)
        throw err
      }

      const { error: deleteError } = await supabase
        .from('rooms')
        .update({ is_deleted: true })
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
        throw deleteError
      }

      setRooms((prev) => prev.filter((r) => r.id !== id))
    },
    [user, rooms],
  )

  const leaveRoom = useCallback(
    async (id) => {
      if (!user) throw new Error('Debes iniciar sesion para abandonar una sala')

      setError(null)

      const room = rooms.find((r) => r.id === id)
      if (!room) {
        const err = new Error('Sala no encontrada')
        setError(err.message)
        throw err
      }

      if (room.role === 'creator') {
        const err = new Error('El creador no puede abandonar la sala. Debes eliminarla.')
        setError(err.message)
        throw err
      }

      const { error: leaveError } = await supabase
        .from('room_members')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', id)
        .eq('user_id', user.id)

      if (leaveError) {
        setError(leaveError.message)
        throw leaveError
      }

      setRooms((prev) => prev.filter((r) => r.id !== id))
    },
    [user, rooms],
  )

  return { rooms, loading, error, createRoom, joinRoom, deleteRoom, leaveRoom }
}
