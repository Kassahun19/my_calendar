import React from 'react';
import { Task } from '../types';
import { H, addD, hOf, iso } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
  viewDate: Date;
  onSelectDay: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, viewDate, onSelectDay }) => {
  const f = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startDay = addD(f, -((f.getDay() + 6) % 7));
  const tdStr = iso(new Date());

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const c = addD(startDay, i);
    const k = iso(c);
    const l = tasks.filter(t => t.date === k);
    const isOtherMonth = c.getMonth() !== f.getMonth();
    const isToday = k === tdStr;

    cells.push(
      <button
        key={k}
        onClick={() => onSelectDay(k)}
        className={`cd min-h-[58px] border border-[var(--line)] bg-[var(--surf2)] rounded-[12px] p-1.5 flex flex-col items-start justify-between text-left transition-all hover:-translate-y-0.5 hover:border-[var(--acc)] ${
          isOtherMonth ? 'opacity-40' : ''
        } ${isToday ? 'bg-[var(--acc)] text-white border-transparent' : ''}`}
        aria-label={`${k}, ${l.length} plans`}
      >
        <b className="text-[13px]">{c.getDate()}</b>
        <div className="dots flex gap-[3px] flex-wrap items-center">
          {l.slice(0, 4).map((t, idx) => {
            const color = hOf(t.h).c;
            return (
              <i
                key={idx}
                className={`w-[7px] h-[7px] rounded-full ${t.done ? 'bg-[var(--c)]' : 'bg-transparent border-[1.5px] border-[var(--c)]'}`}
                style={{ '--c': color } as React.CSSProperties}
              />
            );
          })}
          {l.length > 4 && <small className="text-[10px]">+{l.length - 4}</small>}
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="cal grid grid-cols-7 gap-1 p-[6px_12px_10px]">
        {weekdays.map(w => (
          <div key={w} className="wd text-center text-[12px] text-[var(--mute)] py-1">{w}</div>
        ))}
        {cells}
      </div>
      <p className="nt text-[13px] text-[var(--mute)] p-[0_18px_16px]">
        Tap a day to open it. Filled dots are open plans, hollow are done; colors match the horizons.
      </p>
    </>
  );
};
