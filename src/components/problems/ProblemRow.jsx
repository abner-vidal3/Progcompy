import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const DIFFICULTY_VARIANT = {
  muy_facil: 'success',
  facil: 'success',
  medio_facil: 'info',
  medio: 'info',
  medio_dificil: 'warning',
  dificil: 'warning',
  muy_dificil: 'danger',
};

const STATUS_VARIANT = {
  pendiente: 'neutral',
  intentado: 'warning',
  resuelto: 'success',
};

const DIFFICULTY_LABEL = {
  muy_facil: 'Muy Fácil',
  facil: 'Fácil',
  medio_facil: 'Medio Fácil',
  medio: 'Medio',
  medio_dificil: 'Medio Difícil',
  dificil: 'Difícil',
  muy_dificil: 'Muy Difícil',
};

const STATUS_LABEL = {
  pendiente: 'Pendiente',
  intentado: 'Intentado',
  resuelto: 'Resuelto',
};

export default function ProblemRow({ problem, onEdit, onDelete, onUpdateNotes }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(problem.notes || '');

  const handleRowClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  const handleSaveNotes = (e) => {
    e.stopPropagation();
    onUpdateNotes(problem.id, notes);
  };

  return (
    <>
      {/* Fila principal */}
      <tr
        onClick={handleRowClick}
        className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
      >
        <td className="px-4 py-3 font-mono font-bold text-[var(--color-text)] w-16">
          {problem.letter}
        </td>
        <td className="px-4 py-3 text-sm text-[var(--color-text)]">
          {problem.title}
        </td>
        <td className="px-4 py-3">
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty] || 'neutral'}>
            {DIFFICULTY_LABEL[problem.difficulty] || problem.difficulty}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-[var(--color-text)]/70">
          {problem.estimated_time_minutes != null
            ? `${problem.estimated_time_minutes} min`
            : '—'}
        </td>
        <td className="px-4 py-3">
          <Badge variant={STATUS_VARIANT[problem.status] || 'neutral'}>
            {STATUS_LABEL[problem.status] || problem.status}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleAction(e, () => onEdit(problem))}
              className="p-1.5 rounded-md text-[var(--color-text)]/50 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Editar"
              title="Editar"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => handleAction(e, () => onDelete(problem.id))}
              className="p-1.5 rounded-md text-[var(--color-text)]/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Eliminar"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* Panel expandible */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-4 bg-[var(--color-surface)]/50">
            <div
              className="space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <label className="block text-sm font-medium text-[var(--color-text)]">
                Notas compartidas (Markdown)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full min-h-[120px] rounded-md border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder-gray-400 bg-[var(--color-surface)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-y"
                placeholder="Escribe notas en markdown..."
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveNotes}
              >
                Guardar notas
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
