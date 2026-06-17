import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useRooms } from '../../hooks/useRooms';

export default function CreateRoomModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { createRoom } = useRooms();
  const [name, setName] = useState('');
  const [memberLimit, setMemberLimit] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setName('');
    setMemberLimit('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la sala es obligatorio');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const room = await createRoom(
        name.trim(),
        memberLimit ? parseInt(memberLimit) : null,
      );
      setName('');
      setMemberLimit('');
      setError('');
      onClose();
      navigate(`/rooms/${room.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Sala" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <Input
          label="Nombre de la sala"
          id="room-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <Input
          label="Limite de miembros (opcional)"
          id="room-limit"
          type="number"
          min={1}
          value={memberLimit}
          onChange={(e) => setMemberLimit(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" loading={loading} className="w-full">
          Crear Sala
        </Button>
      </form>
    </Modal>
  );
}
