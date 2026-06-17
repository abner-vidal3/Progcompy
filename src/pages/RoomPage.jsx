import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Copy, Check, Users, Trash2, LogOut } from 'lucide-react'
import { useRooms } from '../hooks/useRooms'
import { useProblems } from '../hooks/useProblems'
import ProblemTable from '../components/problems/ProblemTable'
import ProblemForm from '../components/problems/ProblemForm'
import ChatSidebar from '../components/chat/ChatSidebar'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

export function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rooms, loading: roomsLoading, deleteRoom, leaveRoom } = useRooms()
  const {
    problems,
    loading: problemsLoading,
    error: problemsError,
    filters,
    sort,
    createProblem,
    updateProblem,
    deleteProblem,
    updateNotes,
    setFilters,
    setSort,
  } = useProblems(id)

  const [showForm, setShowForm] = useState(false)
  const [editingProblem, setEditingProblem] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const room = rooms.find((r) => r.id === id)

  // --- Sort handler ---
  const handleSort = useCallback(
    (field) => {
      setSort((prev) => {
        if (prev.field === field) {
          return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        }
        return { field, direction: 'asc' }
      })
    },
    [setSort],
  )

  // --- Filter handler ---
  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters)
    },
    [setFilters],
  )

  // --- Create problem ---
  const handleCreate = useCallback(() => {
    setEditingProblem(null)
    setShowForm(true)
  }, [])

  const handleSaveCreate = useCallback(
    async (data) => {
      try {
        await createProblem(data)
        setShowForm(false)
      } catch (_err) {
        // Error se maneja en useProblems
      }
    },
    [createProblem],
  )

  // --- Edit problem ---
  const handleEdit = useCallback((problem) => {
    setEditingProblem(problem)
    setShowForm(true)
  }, [])

  const handleSaveEdit = useCallback(
    async (data) => {
      if (!editingProblem) return
      try {
        await updateProblem(editingProblem.id, data)
        setShowForm(false)
        setEditingProblem(null)
      } catch (_err) {
        // Error se maneja en useProblems
      }
    },
    [editingProblem, updateProblem],
  )

  // --- Delete problem ---
  const handleDelete = useCallback(
    async (problemId) => {
      if (!window.confirm('¿Eliminar este problema?')) return
      try {
        await deleteProblem(problemId)
      } catch (_err) {
        // Error se maneja en useProblems
      }
    },
    [deleteProblem],
  )

  // --- Copy room code ---
  const handleCopyCode = useCallback(() => {
    if (!room?.code) return
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [room?.code])

  // --- Delete room ---
  const handleDeleteRoom = useCallback(async () => {
    setActionLoading(true)
    try {
      await deleteRoom(id)
      navigate('/rooms', { replace: true })
    } catch (_err) {
      // Error se maneja en useRooms
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }, [id, deleteRoom, navigate])

  // --- Leave room ---
  const handleLeaveRoom = useCallback(async () => {
    setActionLoading(true)
    try {
      await leaveRoom(id)
      navigate('/rooms', { replace: true })
    } catch (_err) {
      // Error se maneja en useRooms
    } finally {
      setActionLoading(false)
    }
  }, [id, leaveRoom, navigate])

  // --- Loading state ---
  if (roomsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    )
  }

  // --- Not found / not a member ---
  if (!room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-4">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Sala no encontrada</h2>
        <p className="text-sm text-[var(--color-text)]/60">
          No perteneces a esta sala o no existe.
        </p>
        <Button variant="primary" onClick={() => navigate('/rooms', { replace: true })}>
          Volver a mis salas
        </Button>
      </div>
    )
  }

  const isCreator = room.role === 'creator'

  return (
    <div className="flex h-full bg-[var(--color-bg)]">
      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Room header */}
        <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: name, code, members */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-[var(--color-text)] truncate max-w-[300px]">
                  {room.name}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text)]/60">
                {/* Copyable code */}
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 font-mono hover:text-[var(--color-primary)] transition-colors"
                >
                  <span>#{room.code}</span>
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                {/* Member count */}
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  <span>Miembros</span>
                </span>
              </div>
            </div>

            {/* Right: room actions */}
            <div className="flex items-center gap-2">
              {isCreator ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Eliminar sala</span>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLeaveRoom}
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Problem area */}
        <div className="flex-1 px-4 py-6 sm:px-6">
          {problemsError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {problemsError}
            </div>
          )}

          <ProblemTable
            problems={problems}
            loading={problemsLoading}
            sort={sort}
            onSort={handleSort}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdateNotes={updateNotes}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Chat sidebar */}
      <ChatSidebar roomId={id} />

      {/* Problem form modal */}
      {showForm && (
        <ProblemForm
          problem={editingProblem}
          onSave={editingProblem ? handleSaveEdit : handleSaveCreate}
          onClose={() => {
            setShowForm(false)
            setEditingProblem(null)
          }}
        />
      )}

      {/* Delete room confirmation modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="Eliminar sala"
          size="sm"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text)]/80">
              ¿Estás seguro de eliminar esta sala? Esta acción no se puede deshacer. Los problemas y mensajes se conservarán pero nadie podrá acceder a ellos.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteRoom}
                loading={actionLoading}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
