import React from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onUndo: (() => void) | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, show, onUndo, onClose }) => {
  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 rounded-[14px] flex gap-3.5 items-center z-50 shadow-[var(--shadow)] animate-[pop_0.3s_ease]"
    >
      <span>{message}</span>
      {onUndo && (
        <button
          onClick={() => {
            onUndo();
            onClose();
          }}
          className="bg-transparent border-0 font-bold text-[var(--acc)] cursor-pointer"
        >
          Undo
        </button>
      )}
    </div>
  );
};
