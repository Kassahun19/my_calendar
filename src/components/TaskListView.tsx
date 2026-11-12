import React, { useState } from 'react';
import { Task, HorizonKey } from '../types';
import { H, PC, PN, esc, hOf, label, range, shift, day0, parse, iso, fmtRem } from '../utils';
import { ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  horizon: HorizonKey;
  viewDate: Date;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  onToggleTask: (id: string, e: React.MouseEvent) => void;
  onToggleSubtask: (taskId: string, subId: string) => void;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  onRollover: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  horizon,
  viewDate,
  onPrevPeriod,
  onNextPeriod,
  onToday,
  onToggleTask,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  onRollover,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  const xDef = hOf(horizon);
  const td = day0(new Date());
  const currentLabel = label(horizon, viewDate);

  const allInPeriod = tasks.filter(t => {
    if (t.h !== horizon) return false;
    const [s, e] = range(horizon, viewDate);
    const x = parse(t.date);
    return x >= s && x < e;
  });

  const doneCount = allInPeriod.filter(t => t.done).length;
  const progressPct = allInPeriod.length ? Math.round((doneCount / allInPeriod.length) * 100) : 0;

  const filtered = allInPeriod.filter(t => {
    const matchesFilter = filter === 'all' || (filter === 'done' ? t.done : !t.done);
    const matchesSearch = !search || `${t.t} ${t.g || ''} ${t.n || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  filtered.sort((a, b) => Number(a.done) - Number(b.done) || b.p - a.p);

  const [currStart] = range(horizon, new Date());
  const [viewStart] = range(horizon, viewDate);
  const prevPeriodUnfinished = tasks.filter(t => !t.done && t.h === horizon && (() => {
    const [s, e] = range(horizon, shift(horizon, viewDate, -1));
    const x = parse(t.date);
    return x >= s && x < e;
  })());

  const showRollover = +currStart === +viewStart && prevPeriodUnfinished.length > 0;

  // Tags for autocomplete
  const tagsList = [...new Set(tasks.map(t => t.g).filter(Boolean))];

  return (
    <>
      <div className="ph flex items-center gap-2 p-[16px_18px_6px] flex-wrap">
        <h2 className="text-[22px] font-bold mr-auto font-[Bricolage_Grotesque]">{currentLabel}</h2>
        <div className="pn flex gap-[6px]">
          <button onClick={onPrevPeriod} className="ib w-[34px] h-[34px] rounded-[10px]" aria-label="Previous period"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={onToday} className="ib w-auto px-3 text-[14px]">Today</button>
          <button onClick={onNextPeriod} className="ib w-[34px] h-[34px] rounded-[10px]" aria-label="Next period"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="tools flex gap-2 p-[8px_18px_12px] flex-wrap">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search plans or tags…  ( / )"
          className="bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[8px_12px] flex-1 min-w-[140px]"
          aria-label="Search"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[8px_12px]"
          aria-label="Filter"
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="pb m-[0_18px_8px] flex items-center gap-3 text-[13px] text-[var(--mute)]">
        <div className="bar flex-1 h-2 bg-[var(--surf2)] rounded-[9px] overflow-hidden">
          <div className="h-full transition-all duration-500 rounded-[9px]" style={{ background: 'var(--acc)', width: `${progressPct}%` }} />
        </div>
        <span>{allInPeriod.length ? `${doneCount} of ${allInPeriod.length} done` : 'No plans yet'}</span>
      </div>

      {showRollover && (
        <div className="roll m-[0_18px_8px] p-[10px_14px] rounded-[12px] bg-[var(--surf2)] flex gap-[10px] items-center justify-between text-[14px]">
          <span>{prevPeriodUnfinished.length} unfinished from last {xDef.n.toLowerCase()}</span>
          <button onClick={onRollover} className="btn ghost py-1 px-3 text-xs">Roll over</button>
        </div>
      )}

      <ul className="list-none m-0 p-[4px_10px_14px]">
        {filtered.length > 0 ? (
          filtered.map((t, i) => {
            const od = !t.done && range(t.h, parse(t.date))[1] <= td;
            return (
              <li
                key={t.id}
                className={`t grid grid-cols-[auto_1fr_auto] gap-3 items-start p-[12px_8px] rounded-[14px] transition-colors hover:bg-[var(--surf2)] ${t.done ? 'done' : ''}`}
                style={{ '--pc': PC[t.p], animationDelay: `${Math.min(i, 10) * 30}ms` } as React.CSSProperties}
              >
                <button
                  onClick={e => onToggleTask(t.id, e)}
                  className="ck w-[26px] h-[26px] rounded-[9px] border-2 border-[var(--pc)] bg-transparent grid place-items-center text-white text-[15px] transition-all mt-[1px]"
                  style={t.done ? { background: PC[t.p] } : {}}
                  aria-label={t.done ? 'Mark open' : 'Mark done'}
                >
                  {t.done ? '✓' : ''}
                </button>
                <div>
                  <div className="tt font-medium cursor-pointer break-words" onClick={() => onEditTask(t)}>
                    {esc(t.t)}
                  </div>
                  {t.n && <div className="nt text-[13px] text-[var(--mute)] mt-0.5">{esc(t.n)}</div>}
                  {t.sub && t.sub.length > 0 && (
                    <div className="subs mt-2 grid gap-0.5">
                      {t.sub.map(s => (
                        <button
                          key={s.id}
                          onClick={() => onToggleSubtask(t.id, s.id)}
                          className={`sb flex gap-2 items-center border-0 bg-transparent text-left py-0.5 text-[14px] ${s.d ? 'text-[var(--mute)] line-through' : 'text-[var(--ink)]'}`}
                        >
                          <i className={`w-4 h-4 rounded-[5px] border-[1.5px] border-[var(--mute)] grid place-items-center text-[11px] not-italic ${s.d ? 'bg-[var(--acc)] border-[var(--acc)] text-white' : ''}`}>
                            {s.d ? '✓' : ''}
                          </i>
                          {esc(s.t)}
                        </button>
                      ))}
                      <div className="sbar h-[3px] bg-[var(--line)] rounded-[3px] mt-1 overflow-hidden">
                        <div className="h-full bg-[var(--acc)] transition-all duration-400" style={{ width: `${(t.sub.filter(s => s.d).length / t.sub.length) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="meta flex gap-1.5 flex-wrap mt-1 text-[12px] text-[var(--mute)]">
                    <span className="chip bg-[var(--surf2)] rounded-[8px] px-2 py-0.5">{PN[t.p]}</span>
                    {t.g && <span className="chip bg-[var(--surf2)] rounded-[8px] px-2 py-0.5">{esc(t.g)}</span>}
                    {od && <span className="chip od bg-red-500/10 text-red-500 rounded-[8px] px-2 py-0.5">Overdue</span>}
                    {t.rep && t.rep !== 'none' && <span className="chip bg-[var(--surf2)] rounded-[8px] px-2 py-0.5">↻ {t.rep}</span>}
                    {t.rem && !t.done && <span className="chip rm bg-[var(--acc)]/20 text-[var(--ink)] rounded-[8px] px-2 py-0.5">⏰ {fmtRem(t.rem)}</span>}
                  </div>
                </div>
                <div className="act flex gap-0.5 opacity-50 hover:opacity-100">
                  <button onClick={() => onEditTask(t)} className="border-0 bg-transparent w-8 h-8 rounded-[9px] text-[var(--mute)] hover:bg-[var(--line)] hover:text-[var(--ink)] flex items-center justify-center" aria-label="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteTask(t.id)} className="border-0 bg-transparent w-8 h-8 rounded-[9px] text-[var(--mute)] hover:bg-[var(--line)] hover:text-[var(--ink)] flex items-center justify-center" aria-label="Delete">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <li className="empty text-center py-[38px] px-5 text-[var(--mute)]">
            <b className="block text-[var(--ink)] font-[Bricolage_Grotesque] text-[20px] mb-1">{allInPeriod.length ? 'Nothing matches' : 'A clean slate'}</b>
            {allInPeriod.length ? 'Try a different search or filter.' : `Add your first ${xDef.n.toLowerCase()} plan with the + button.`}
          </li>
        )}
      </ul>
    </>
  );
};
