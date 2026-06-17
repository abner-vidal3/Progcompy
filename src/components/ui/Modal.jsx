import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const sizeClasses = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Activar animación en el siguiente frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    } else {
      setAnimating(false);
      // Esperar a que termine la transición antes de desmontar
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    // Solo cerrar si se hizo clic directamente en el backdrop
    if (contentRef.current && !contentRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${
        animating ? 'bg-black/50' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={contentRef}
        className={`relative w-full ${sizeClasses[size]} rounded-lg bg-[var(--color-bg)] shadow-xl border border-[var(--color-border)] transition-all duration-200 ${
          animating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
