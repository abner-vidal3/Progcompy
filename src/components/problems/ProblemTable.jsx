import { Plus, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import FilterBar from './FilterBar';
import ProblemRow from './ProblemRow';

const SORTABLE_COLUMNS = [
  { key: 'letter', label: 'Letra' },
  { key: 'title', label: 'Título' },
  { key: 'difficulty', label: 'Dificultad' },
  { key: 'estimated_time_minutes', label: 'Tiempo' },
  { key: 'status', label: 'Estado' },
];

export default function ProblemTable({
  problems,
  loading,
  sort,
  onSort,
  onCreate,
  onEdit,
  onDelete,
  onUpdateNotes,
  filters,
  onFilterChange,
}) {
  const renderSortIndicator = (field) => {
    if (sort?.field !== field) return null;
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="w-full">
      {/* Header: filtros + botón nuevo problema */}
      <div className="flex items-end justify-between gap-4">
        {filters !== undefined && (
          <FilterBar filters={filters} onFilterChange={onFilterChange} />
        )}
        <Button variant="primary" onClick={onCreate}>
          <Plus size={16} />
          Nuevo Problema
        </Button>
      </div>

      {/* Tabla */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-surface)]">
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]/70 cursor-pointer select-none hover:text-[var(--color-text)] transition-colors"
                >
                  {col.label}
                  {renderSortIndicator(col.key)}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]/70">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading: 4 filas
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <div className="h-4 w-6 bg-[var(--color-surface)] animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-48 bg-[var(--color-surface)] animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 bg-[var(--color-surface)] animate-pulse rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 bg-[var(--color-surface)] animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 bg-[var(--color-surface)] animate-pulse rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-14 bg-[var(--color-surface)] animate-pulse rounded" />
                  </td>
                </tr>
              ))
            ) : problems.length === 0 ? (
              // Estado vacío
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ClipboardList
                      size={48}
                      className="text-[var(--color-text)]/20 mb-4"
                    />
                    <p className="text-sm font-medium text-[var(--color-text)]/60">
                      No hay problemas todavía.
                    </p>
                    <p className="text-xs text-[var(--color-text)]/40 mt-1">
                      ¡Crea el primero!
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              problems.map((problem) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateNotes={onUpdateNotes}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
