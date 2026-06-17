import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useProblems(roomId) {
  const { user } = useAuth()
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFiltersState] = useState({ difficulty: null, status: null })
  const [sort, setSortState] = useState({ field: 'letter', direction: 'asc' })

  const fetchProblems = useCallback(async () => {
    if (!user || !roomId) return

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('problems')
        .select(
          'id, room_id, letter, title, difficulty, estimated_time_minutes, status, notes, created_by, created_at, updated_at',
        )
        .eq('room_id', roomId)

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setProblems(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, roomId, filters, sort])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  const createProblem = useCallback(
    async (data) => {
      if (!user) throw new Error('Debes iniciar sesion para crear un problema')

      setError(null)

      // Determine next letter
      const { data: lastProblem, error: letterError } = await supabase
        .from('problems')
        .select('letter')
        .eq('room_id', roomId)
        .order('letter', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (letterError) {
        setError(letterError.message)
        throw letterError
      }

      const nextLetter = lastProblem
        ? String.fromCharCode(lastProblem.letter.charCodeAt(0) + 1)
        : 'A'

      const { data: problemData, error: insertError } = await supabase
        .from('problems')
        .insert({
          room_id: roomId,
          letter: nextLetter,
          title: data.title,
          difficulty: data.difficulty,
          estimated_time_minutes: data.estimated_time_minutes ?? null,
          status: data.status ?? 'pendiente',
          notes: '',
          created_by: user.id,
        })
        .select(
          'id, room_id, letter, title, difficulty, estimated_time_minutes, status, notes, created_by, created_at, updated_at',
        )
        .single()

      if (insertError) {
        setError(insertError.message)
        throw insertError
      }

      setProblems((prev) => {
        const updated = [...prev, problemData]
        updated.sort((a, b) => {
          if (a.letter < b.letter) return -1
          if (a.letter > b.letter) return 1
          return 0
        })
        return updated
      })

      return problemData
    },
    [user, roomId],
  )

  const updateProblem = useCallback(
    async (id, data) => {
      if (!user) throw new Error('Debes iniciar sesion para actualizar un problema')

      setError(null)

      const updateData = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
      if (data.estimated_time_minutes !== undefined)
        updateData.estimated_time_minutes = data.estimated_time_minutes
      if (data.status !== undefined) updateData.status = data.status

      const { data: problemData, error: updateError } = await supabase
        .from('problems')
        .update(updateData)
        .eq('id', id)
        .select(
          'id, room_id, letter, title, difficulty, estimated_time_minutes, status, notes, created_by, created_at, updated_at',
        )
        .single()

      if (updateError) {
        setError(updateError.message)
        throw updateError
      }

      setProblems((prev) =>
        prev.map((p) => (p.id === id ? problemData : p)),
      )

      return problemData
    },
    [user],
  )

  const deleteProblem = useCallback(
    async (id) => {
      if (!user) throw new Error('Debes iniciar sesion para eliminar un problema')

      setError(null)

      const { error: deleteError } = await supabase
        .from('problems')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
        throw deleteError
      }

      setProblems((prev) => prev.filter((p) => p.id !== id))
    },
    [user],
  )

  const updateNotes = useCallback(
    async (id, notes) => {
      if (!user) throw new Error('Debes iniciar sesion para actualizar las notas')

      setError(null)

      const { error: updateError } = await supabase
        .from('problems')
        .update({ notes })
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        throw updateError
      }

      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, notes } : p)),
      )
    },
    [user],
  )

  const setFilters = useCallback(({ difficulty, status }) => {
    setFiltersState({ difficulty: difficulty ?? null, status: status ?? null })
  }, [])

  const setSort = useCallback(({ field, direction }) => {
    setSortState({ field, direction })
  }, [])

  return {
    problems,
    loading,
    error,
    filters,
    sort,
    fetchProblems,
    createProblem,
    updateProblem,
    deleteProblem,
    updateNotes,
    setFilters,
    setSort,
  }
}
