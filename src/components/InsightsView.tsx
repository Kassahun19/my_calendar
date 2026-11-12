import React from 'react';
import { Task } from '../types';
import { H, addD, day0, esc, range, parse } from '../utils';

interface InsightsViewProps {
  tasks: Task[];
  streak: number;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ tasks, streak }) => {
  const dn = tasks.filter(t => t.done);
  const now = day0(new Date());
  const days = [...Array(14)].map((_, i) => addD(now, i - 13));
  const cn = days.map(d => {
    const isoD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dn.filter(t => t.doneAt === isoD).length;
  });
  const mx = Math.max(3, ...cn);

  const od = tasks.filter(t => !t.done && range(t.h, parse(t.date))[1] <= now).length;
  const rate = tasks.length ? Math.round((dn.length / tasks.length) * 100) : 0;

  const tags: Record<string, [number, number]> = {};
  tasks.forEach(t => {
    const g = t.g || 'Untagged';
    if (!tags[g]) tags[g] = [0, 0];
    tags[g][t.done ? 0 : 1]++;
  });

  const tagBars = Object.entries(tags)
    .sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1]))
    .slice(0, 6)
    .map(([g, [d, o]]) => {
      const total = d + o;
      const pct = total ? (d / total) * 100 : 0;
      return (
        <div key={g} className="hb grid grid-cols-[76px_1fr_44px] gap-[10px] items-center text-[14px] my-1.5">
          <span className="truncate">{esc(g)}</span>
          <div className="bar h-[6px] rounded-[9px] bg-[var(--surf2)] overflow-hidden">
            <div className="h-full rounded-[9px]" style={{ width: `${pct}%`, background: 'var(--acc)' }} />
          </div>
          <small className="text-[var(--mute)] tabular-nums">{d}/{total}</small>
        </div>
      );
    });

  const horizonBars = H.map(x => {
    const l = tasks.filter(t => t.h === x.k);
    const d = l.filter(t => t.done).length;
    const pct = l.length ? (d / l.length) * 100 : 0;
    return (
      <div key={x.k} className="hb grid grid-cols-[76px_1fr_44px] gap-[10px] items-center text-[14px] my-1.5">
        <span>{x.n}</span>
        <div className="bar h-[6px] rounded-[9px] bg-[var(--surf2)] overflow-hidden">
          <div className="h-full rounded-[9px]" style={{ width: `${pct}%`, background: x.c }} />
        </div>
        <small className="text-[var(--mute)] tabular-nums">{d}/{l.length}</small>
      </div>
    );
  });

  return (
    <div className="ins p-[6px_18px_20px]">
      <div className="kp grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-[10px]">
        <div className="stat bg-[var(--surf2)] rounded-[14px] p-[10px_14px]">
          <b className="font-[Bricolage_Grotesque] font-bold text-[22px] block leading-tight">{dn.length}</b>
          <span className="text-[12px] text-[var(--mute)]">completed</span>
        </div>
        <div className="stat bg-[var(--surf2)] rounded-[14px] p-[10px_14px]">
          <b className="font-[Bricolage_Grotesque] font-bold text-[22px] block leading-tight">{rate}%</b>
          <span className="text-[12px] text-[var(--mute)]">completion rate</span>
        </div>
        <div className="stat bg-[var(--surf2)] rounded-[14px] p-[10px_14px]">
          <b className="font-[Bricolage_Grotesque] font-bold text-[22px] block leading-tight">{od}</b>
          <span className="text-[12px] text-[var(--mute)]">overdue</span>
        </div>
        <div className="stat bg-[var(--surf2)] rounded-[14px] p-[10px_14px]">
          <b className="font-[Bricolage_Grotesque] font-bold text-[22px] block leading-tight">{streak}</b>
          <span className="text-[12px] text-[var(--mute)]">day streak</span>
        </div>
      </div>

      <h3 className="text-[16px] font-bold font-[Bricolage_Grotesque] my-[22px_8px]">Completed, last 14 days</h3>
      <svg viewBox="0 0 426 155" className="ch w-full max-w-[560px]">
        {cn.map((v, i) => {
          const g = (v / mx) * 110;
          return (
            <React.Fragment key={i}>
              <rect
                x={i * 30 + 6}
                y={130 - g}
                width={20}
                height={Math.max(g, 3)}
                rx={6}
                fill="var(--acc)"
                opacity={v ? 1 : 0.25}
                className="transform-box-[fill-box] origin-bottom animate-[gr_0.8s_both_cubic-bezier(0.2,0.8,0.2,1)]"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <title>{v} done</title>
              </rect>
              <text x={i * 30 + 16} y={148} textAnchor="middle" fontSize={10} fill="var(--mute)">
                {days[i].getDate()}
              </text>
            </React.Fragment>
          );
        })}
      </svg>

      <h3 className="text-[16px] font-bold font-[Bricolage_Grotesque] my-[22px_8px]">By horizon</h3>
      {horizonBars}

      <h3 className="text-[16px] font-bold font-[Bricolage_Grotesque] my-[22px_8px]">By tag</h3>
      {tagBars.length ? tagBars : <p className="nt text-[13px] text-[var(--mute)]">Add tags to see them here.</p>}
    </div>
  );
};
