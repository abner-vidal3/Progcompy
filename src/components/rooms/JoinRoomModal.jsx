import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useRooms } from '../../hooks/useRooms';

export default function JoinRoomModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { joinRoom } = useRooms();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setCode('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || trimmed.length !== 6) {
      setError('El codigo debe tener 6 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const room = await joinRoom(trimmed.toUpperCase());
      setCode('');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Unirse a Sala" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <Input
          label="Codigo de la sala"
          id="room-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          disabled={loading}
          autoFocus
        />
        <Button type="submit" loading={loading} className="w-full">
          Unirse
        </Button>
      </form>
    </Modal>
  );
}
