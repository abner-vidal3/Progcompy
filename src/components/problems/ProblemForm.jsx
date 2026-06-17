import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const DIFFICULTY_OPTIONS = [
  { value: 'muy_facil', label: 'Muy Fácil' },
  { value: 'facil', label: 'Fácil' },
  { value: 'medio_facil', label: 'Medio Fácil' },
  { value: 'medio', label: 'Medio' },
  { value: 'medio_dificil', label: 'Medio Difícil' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'muy_dificil', label: 'Muy Difícil' },
];

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'intentado', label: 'Intentado' },
  { value: 'resuelto', label: 'Resuelto' },
];

const INITIAL_FORM = {
  title: '',
  difficulty: 'medio',
  estimated_time_minutes: '',
  status: 'pendiente',
};

export default function ProblemForm({ problem, onSave, onClose }) {
  const [formData, setFormData] = useState(() => {
    if (problem) {
      return {
        title: problem.title || '',
        difficulty: problem.difficulty || 'medio',
        estimated_time_minutes: problem.estimated_time_minutes ?? '',
        status: problem.status || 'pendiente',
      };
    }
    return { ...INITIAL_FORM };
  });

  const [errors, setErrors] = useState({});

  const isEditing = !!problem;

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (
      formData.estimated_time_minutes !== '' &&
      (isNaN(formData.estimated_time_minutes) ||
        Number(formData.estimated_time_minutes) < 1)
    ) {
      newErrors.estimated_time_minutes = 'Debe ser mayor a 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...formData,
      estimated_time_minutes:
        formData.estimated_time_minutes === ''
          ? null
          : Number(formData.estimated_time_minutes),
    };

    onSave(data);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Editar Problema' : 'Nuevo Problema'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isEditing && problem.letter && (
          <p className="text-sm font-mono font-bold text-[var(--color-text)]/70">
            Problema {problem.letter}
          </p>
        )}

        <Input
          name="title"
          type="text"
          label="Título"
          placeholder="Título del problema"
          value={formData.title}
          onChange={handleChange('title')}
          error={errors.title}
        />

        <Select
          name="difficulty"
          label="Dificultad"
          options={DIFFICULTY_OPTIONS}
          value={formData.difficulty}
          onChange={handleChange('difficulty')}
        />

        <Input
          name="estimated_time_minutes"
          type="number"
          label="Tiempo estimado"
          placeholder="Minutos estimados"
          min={1}
          value={formData.estimated_time_minutes}
          onChange={handleChange('estimated_time_minutes')}
          error={errors.estimated_time_minutes}
        />

        <Select
          name="status"
          label="Estado"
          options={STATUS_OPTIONS}
          value={formData.status}
          onChange={handleChange('status')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
