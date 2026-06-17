import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Plus, LogOut, User, Hash, LogIn } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import CreateRoomModal from '../rooms/CreateRoomModal';
import JoinRoomModal from '../rooms/JoinRoomModal';

export default function TopNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // El logout puede fallar si la sesion ya expiro, no es critico
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link
            to="/rooms"
            className="flex items-center gap-2 text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors shrink-0"
          >
            <Hash size={24} className="text-[var(--color-primary)]" />
            <span className="font-bold text-lg hidden sm:inline">Progcompy</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-[var(--color-text)]/70 hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Crear Sala */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Crear sala"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Crear Sala</span>
            </Button>

            {/* Unirse */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsJoinModalOpen(true)}
              aria-label="Unirse a sala"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Unirse</span>
            </Button>

            {/* User Info */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-[var(--color-border)]">
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-text)]/80">
                <User size={16} className="shrink-0" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[var(--color-text)]/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-[var(--color-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/40"
                aria-label="Cerrar sesion"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modales */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </>
  );
}
