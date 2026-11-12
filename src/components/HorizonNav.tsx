import React from 'react';
import { HorizonKey } from '../types';
import { H } from '../utils';

interface HorizonNavProps {
  currentHorizon: HorizonKey;
  onSelectHorizon: (h: HorizonKey) => void;
}

export const HorizonNav: React.FC<HorizonNavProps> = ({ currentHorizon, onSelectHorizon }) => {
  return (
    <nav className="tabs sticky top-[env(safe-area-inset-top,0px)] z-20 flex gap-[6px] overflow-x-auto py-[14px] pb-[10px] bg-[var(--bg)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Planning horizon">
      {H.map(x => (
        <button
          key={x.k}
          role="tab"
          aria-selected={x.k === currentHorizon}
          onClick={() => onSelectHorizon(x.k)}
          style={{ '--c': x.c } as React.CSSProperties}
          className={`tab flex-none border border-[var(--line)] bg-[var(--surf)] rounded-full px-4 py-2 font-medium transition-all duration-250 ${
            x.k === currentHorizon ? 'bg-[var(--c)] border-[var(--c)] text-white shadow-[0_6px_16px_-6px_var(--c)]' : 'hover:border-[var(--acc)]'
          }`}
        >
          {x.n}
        </button>
      ))}
    </nav>
  );
};
