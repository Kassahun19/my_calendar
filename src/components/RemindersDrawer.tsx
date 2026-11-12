import React from 'react';
import { Task } from '../types';
import { fmtRem, esc } from '../utils';
import { X } from 'lucide-react';

interface RemindersDrawerProps {
  isOpen: boolean;
  tasks: Task[];
  onClose: () => void;
  onRequestNotificationPermission: () => void;
  onSnooze: (taskId: string, mins: number | 'x') => void;
  onSelectTask: (t: Task) => void;
}

export const RemindersDrawer: React.FC<RemindersDrawerProps> = ({
  isOpen,
  tasks,
  onClose,
  onRequestNotificationPermission,
  onSnooze,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  const up = tasks.filter(t => !t.done && t.rem);
  const ms = up.filter(t => t.fired);
  const nx = up.filter(t => !t.fired).sort((a, b) => (a.rem || '').localeCompare(b.rem || ''));
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-[min(390px,100vw)] bg-[var(--surf)] border-l border-[var(--line)] z-60 p-[calc(18px+env(safe-area-inset-top,0px))_18px_18px] shadow-[var(--shadow)] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[24px] font-bold font-[Bricolage_Grotesque]">Reminders</h3>
        <button onClick={onClose} className="ib w-9 h-9 rounded-xl flex items-center justify-center" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-[var(--surf2)] rounded-[14px] p-3 grid gap-2 text-[14px] mb-4">
        {perm === 'granted' ? (
          <span>✓ System notifications are on</span>
        ) : perm === 'denied' ? (
          <span className="text-red-500">Notifications are blocked in your browser settings</span>
        ) : perm === 'unsupported' ? (
          <span>Notifications aren’t supported here</span>
        ) : (
          <button onClick={onRequestNotificationPermission} className="btn py-2 px-3 text-xs">
            Enable system notifications
          </button>
        )}
        <small className="text-[var(--mute)] text-[12px]">
          Reminders ring while Cadence is open in a tab. Any you miss appear here when you return.
        </small>
      </div>

      {ms.length > 0 && (
        <>
          <h4 className="font-bold text-[14px] text-[var(--mute)] mb-2 mt-4">Needs attention</h4>
          <div className="grid gap-2">
            {ms.map(t => (
              <div key={t.id} className="flex justify-between gap-2 items-center p-3 rounded-[14px] border border-red-500/40 bg-red-500/5">
                <div className="cursor-pointer min-w-0" onClick={() => { onSelectTask(t); onClose(); }}>
                  <b className="block truncate text-[14px]">{esc(t.t)}</b>
                  <small className="text-[12px] text-[var(--mute)]">Rang · {fmtRem(t.rem!)}</small>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => onSnooze(t.id, 10)} className="bg-[var(--surf2)] border border-[var(--line)] rounded-lg px-2 py-1 text-[12px]">+10m</button>
                  <button onClick={() => onSnooze(t.id, 60)} className="bg-[var(--surf2)] border border-[var(--line)] rounded-lg px-2 py-1 text-[12px]">+1h</button>
                  <button onClick={() => onSnooze(t.id, 'x')} className="bg-[var(--surf2)] border border-[var(--line)] rounded-lg px-2 py-1 text-[12px]" aria-label="Clear reminder">✕</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h4 className="font-bold text-[14px] text-[var(--mute)] mb-2 mt-4">Upcoming</h4>
      {nx.length > 0 ? (
        <div className="grid gap-2">
          {nx.map(t => (
            <div key={t.id} className="flex justify-between gap-2 items-center p-3 rounded-[14px] border border-[var(--line)] bg-[var(--surf)]">
              <div className="cursor-pointer min-w-0" onClick={() => { onSelectTask(t); onClose(); }}>
                <b className="block truncate text-[14px]">{esc(t.t)}</b>
                <small className="text-[12px] text-[var(--mute)]">{fmtRem(t.rem!)}</small>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onSnooze(t.id, 10)} className="bg-[var(--surf2)] border border-[var(--line)] rounded-lg px-2 py-1 text-[12px]">+10m</button>
                <button onClick={() => onSnooze(t.id, 60)} className="bg-[var(--surf2)] border border-[var(--line)] rounded-lg px-2 py-1 text-[12px]">+1h</button>
                <button onClick={() => onSnooze(t.id, 'x')} className="bg-[var(--surf2)] border border-[var(--line)] rounded-lg px-2 py-1 text-[12px]" aria-label="Clear reminder">✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[var(--mute)] mt-2">Nothing scheduled. Add a reminder when you create a plan.</p>
      )}
    </aside>
  );
};
