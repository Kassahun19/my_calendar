import React from 'react';
import { Download, Upload, Bell, Moon, Sun, Sparkles, Plus } from 'lucide-react';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleReminders: () => void;
  onOpenAICoach: () => void;
  onNewPlan: () => void;
  reminderCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onExport,
  onImport,
  onToggleReminders,
  onOpenAICoach,
  onNewPlan,
  reminderCount,
}) => {
  return (
    <header className="flex items-center gap-2 py-2 pb-4">
      <div className="logo disp font-extrabold text-2xl flex items-center gap-2 mr-auto">
        <i className="w-[22px] h-[22px] rounded-full inline-block transition-colors duration-400" style={{ border: '5px solid var(--acc)' }} />
        Cadence
      </div>
      <button
        onClick={onOpenAICoach}
        className="ib flex items-center gap-1.5 px-3 w-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 font-semibold text-sm"
        title="AI Horizon Coach"
      >
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="hidden sm:inline">AI Coach</span>
      </button>
      <button onClick={onExport} className="ib" title="Export backup" aria-label="Export backup">
        <Download className="w-4 h-4" />
      </button>
      <button onClick={onImport} className="ib" title="Import backup" aria-label="Import backup">
        <Upload className="w-4 h-4" />
      </button>
      <button onClick={onToggleReminders} className="ib relative" title="Reminders" aria-label="Reminders">
        <Bell className="w-4 h-4" />
        {reminderCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-semibold text-[11px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
            {reminderCount}
          </span>
        )}
      </button>
      <button onClick={onToggleTheme} className="ib" title="Toggle theme" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <button onClick={onNewPlan} className="btn flex items-center gap-1 text-sm py-2 px-4">
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New plan</span>
      </button>
    </header>
  );
};
