import React from 'react';
import { Task, HorizonKey } from '../types';
import { H, elapsed, inP } from '../utils';

interface HeroRingsProps {
  tasks: Task[];
  onSelectHorizon: (h: HorizonKey) => void;
}

export const HeroRings: React.FC<HeroRingsProps> = ({ tasks, onSelectHorizon }) => {
  const now = new Date();
  const R = [104, 90, 76, 62, 48, 34];

  const cur = H.map(x => {
    const l = tasks.filter(t => inP(t, x.k, now));
    return { x, d: l.filter(t => t.done).length, n: l.length };
  });

  const td = tasks.filter(t => inP(t, 'day', now));
  const donePct = td.length ? Math.round((td.filter(t => t.done).length / td.length) * 100) : 0;

  // Calculate streak
  const streak = React.useMemo(() => {
    const s = new Set(tasks.filter(t => t.doneAt).map(t => t.doneAt));
    let d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let n = 0;
    const isoDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    if (!s.has(isoDate(d) as any)) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    }
    while (s.has(isoDate(d) as any)) {
      n++;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    }
    return n;
  }, [tasks]);

  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const yearElapsed = Math.round(elapsed('year') * 100);

  const doneToday = tasks.filter(t => t.doneAt === (new Date().toISOString().split('T')[0])).length;
  const openPlans = tasks.filter(t => !t.done).length;

  return (
    <section className="hero grid gap-5 bg-[var(--surf)] border border-[var(--line)] rounded-[24px] p-5 md:p-[26px_30px] md:grid-cols-[270px_1fr] md:items-center shadow-[var(--shadow)] mb-5">
      <div className="rings relative w-[240px] max-w-full mx-auto">
        <svg viewBox="0 0 240 240" className="w-full block -rotate-90">
          {cur.map((c, i) => {
            const circ = 2 * Math.PI * R[i];
            const ratio = c.n ? c.d / c.n : 0;
            const offset = circ * (1 - ratio);
            return (
              <React.Fragment key={c.x.k}>
                <circle cx="120" cy="120" r={R[i]} className="fill-none stroke-[9px] stroke-linecap-round" stroke="var(--surf2)" />
                <circle
                  cx="120"
                  cy="120"
                  r={R[i]}
                  className="fill-none stroke-[9px] stroke-linecap-round transition-all duration-1000 ease-out"
                  stroke={c.x.c}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                />
              </React.Fragment>
            );
          })}
        </svg>
        <div className="mid absolute inset-0 grid place-content-center text-center">
          <b className="font-[Bricolage_Grotesque] font-extrabold text-[44px] leading-none">{td.length ? `${donePct}%` : '—'}</b>
          <span className="text-[var(--mute)] text-[13px]">{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
      <div>
        <h1 className="text-[clamp(26px,4.5vw,38px)] leading-[1.1] font-extrabold font-[Bricolage_Grotesque]">{greeting}. Let’s shape your time.</h1>
        <p className="sub text-[var(--mute)] my-[6px_16px]">You’re {yearElapsed}% through {now.getFullYear()}. Small days add up to big years.</p>
        <div className="stats flex gap-[10px] flex-wrap mb-4">
          <div className="stat bg-[var(--surf2)] rounded-[14px] p-[8px_14px]">
            <b className="font-[Bricolage_Grotesque] font-bold text-[20px] block leading-[1.2]">{doneToday}</b>
            <span className="text-[12px] text-[var(--mute)]">done today</span>
          </div>
          <div className="stat bg-[var(--surf2)] rounded-[14px] p-[8px_14px]">
            <b className="font-[Bricolage_Grotesque] font-bold text-[20px] block leading-[1.2]">{streak}</b>
            <span className="text-[12px] text-[var(--mute)]">day streak</span>
          </div>
          <div className="stat bg-[var(--surf2)] rounded-[14px] p-[8px_14px]">
            <b className="font-[Bricolage_Grotesque] font-bold text-[20px] block leading-[1.2]">{openPlans}</b>
            <span className="text-[12px] text-[var(--mute)]">open plans</span>
          </div>
        </div>
        <div className="leg grid gap-[6px]">
          {cur.map(c => (
            <button
              key={c.x.k}
              onClick={() => onSelectHorizon(c.x.k)}
              className="lg grid grid-cols-[12px_84px_1fr_auto] gap-[10px] items-center border-0 bg-transparent text-left p-[5px_6px] rounded-[10px] text-[14px] hover:bg-[var(--surf2)]"
              title={`Go to ${c.x.n}`}
            >
              <i className="w-[10px] h-[10px] rounded-full inline-block" style={{ background: c.x.c }} />
              <span className="font-medium">{c.x.n}</span>
              <div className="bar h-[6px] rounded-[9px] bg-[var(--surf2)] overflow-hidden">
                <u className="block h-full rounded-[9px] transition-all duration-800" style={{ background: c.x.c, width: `${Math.round(elapsed(c.x.k) * 100)}%` }} />
              </div>
              <small className="text-[var(--mute)] tabular-nums">{c.d}/{c.n} done</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
