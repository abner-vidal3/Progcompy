import { useRooms } from '../hooks/useRooms'
import RoomCard from '../components/rooms/RoomCard'
import { Hash } from 'lucide-react'

function RoomSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-24">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-[var(--color-text)]/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[var(--color-text)]/10" />
          <div className="h-3 w-1/2 rounded bg-[var(--color-text)]/10" />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
        <Hash className="h-8 w-8 text-[var(--color-primary)]" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">
        No estás en ninguna sala todavía
      </h2>
      <p className="text-sm text-[var(--color-text)]/60">
        Crea una nueva sala o únete a una existente con su código para empezar.
      </p>
    </div>
  )
}

export function RoomListPage() {
  const { rooms, loading, error } = useRooms()

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold text-[var(--color-text)]">
          Mis Salas
        </h1>

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
