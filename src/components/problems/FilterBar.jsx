import Select from '../ui/Select';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Todas las dificultades' },
  { value: 'muy_facil', label: 'Muy Fácil' },
  { value: 'facil', label: 'Fácil' },
  { value: 'medio_facil', label: 'Medio Fácil' },
  { value: 'medio', label: 'Medio' },
  { value: 'medio_dificil', label: 'Medio Difícil' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'muy_dificil', label: 'Muy Difícil' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'intentado', label: 'Intentado' },
  { value: 'resuelto', label: 'Resuelto' },
];

export default function FilterBar({ filters, onFilterChange }) {
  const handleDifficultyChange = (e) => {
    onFilterChange({ ...filters, difficulty: e.target.value });
  };

  const handleStatusChange = (e) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  return (
    <div className="flex gap-3 items-end py-2">
      <Select
        name="filter-difficulty"
        options={DIFFICULTY_OPTIONS}
        value={filters?.difficulty || ''}
        onChange={handleDifficultyChange}
        placeholder="Todas las dificultades"
        className="min-w-[180px]"
      />
      <Select
        name="filter-status"
        options={STATUS_OPTIONS}
        value={filters?.status || ''}
        onChange={handleStatusChange}
        placeholder="Todos los estados"
        className="min-w-[160px]"
      />
    </div>
  );
}
