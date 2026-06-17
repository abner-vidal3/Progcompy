import { Link } from 'react-router-dom';
import { Hash } from 'lucide-react';

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  return date.toLocaleDateString('es-ES');
}

export default function RoomCard({ room }) {
  const isCreator = room.role === 'creator';

  return (
    <Link
      to={`/rooms/${room.id}`}
      className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 transition-all hover:shadow-md hover:border-[var(--color-primary)]/30 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side: room info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[var(--color-text)] truncate">
            {room.name}
          </h3>

          <div className="flex items-center gap-2 mt-1.5">
            {/* Room code */}
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text)]/50 font-mono">
              <Hash size={12} />
              {room.code}
            </span>

            {/* Last activity */}
            <span className="text-xs text-[var(--color-text)]/40">
              {room.updated_at ? timeAgo(room.updated_at) : ''}
            </span>
          </div>
        </div>

        {/* Right side: role badge */}
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isCreator
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {isCreator ? 'Creador' : 'Miembro'}
        </span>
      </div>
    </Link>
  );
}
