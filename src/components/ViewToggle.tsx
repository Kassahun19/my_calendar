import React from 'react';
import { ViewMode } from '../types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onSelectViewMode: (v: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onSelectViewMode }) => {
  return (
    <div className="vs flex gap-1 bg-[var(--surf)] border border-[var(--line)] rounded-[14px] p-1 my-[2px] mb-3 w-max max-w-full">
      <button
        aria-pressed={viewMode === 'list'}
        onClick={() => onSelectViewMode('list')}
        className="border-0 bg-transparent rounded-[10px] px-4 py-[7px] font-medium text-[var(--mute)] transition-all duration-250 aria-pressed:bg-[var(--acc)] aria-pressed:text-white"
      >
        List
      </button>
      <button
        aria-pressed={viewMode === 'cal'}
        onClick={() => onSelectViewMode('cal')}
        className="border-0 bg-transparent rounded-[10px] px-4 py-[7px] font-medium text-[var(--mute)] transition-all duration-250 aria-pressed:bg-[var(--acc)] aria-pressed:text-white"
      >
        Calendar
      </button>
      <button
        aria-pressed={viewMode === 'ins'}
        onClick={() => onSelectViewMode('ins')}
        className="border-0 bg-transparent rounded-[10px] px-4 py-[7px] font-medium text-[var(--mute)] transition-all duration-250 aria-pressed:bg-[var(--acc)] aria-pressed:text-white"
      >
        Insights
      </button>
    </div>
  );
};
