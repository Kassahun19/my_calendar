import { HorizonDef, HorizonKey } from './types';

export const H: HorizonDef[] = [
  { k: 'day', n: 'Day', c: '#F59E0B', m: 0 },
  { k: 'week', n: 'Week', c: '#0EA5A4', m: 0 },
  { k: 'month', n: 'Month', c: '#3B82F6', m: 1 },
  { k: 'quarter', n: 'Quarter', c: '#8B5CF6', m: 3 },
  { k: 'half', n: 'Half-year', c: '#EC4899', m: 6 },
  { k: 'year', n: 'Year', c: '#7C8AA8', m: 12 },
];

export const PC: Record<number, string> = { 1: '#6A7389', 2: '#F59E0B', 3: '#E5484D' };
export const PN: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };

export const addD = (d: Date, k: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
export const day0 = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const iso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parse = (s: string): Date => {
  const [a, b, c] = s.split('-').map(Number);
  return new Date(a, b - 1, c);
};

export const esc = (s: string): string =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export const hOf = (k: HorizonKey): HorizonDef => H.find(h => h.k === k) || H[0];

export function range(k: HorizonKey, d: Date): [Date, Date] {
  const base = day0(d);
  if (k === 'day') return [base, addD(base, 1)];
  if (k === 'week') {
    const s = addD(base, -((base.getDay() + 6) % 7));
    return [s, addD(s, 7)];
  }
  const hDef = hOf(k);
  const n = hDef.m;
  const m = Math.floor(base.getMonth() / n) * n;
  return [new Date(base.getFullYear(), m, 1), new Date(base.getFullYear(), m + n, 1)];
}

export function shift(k: HorizonKey, d: Date, s: number): Date {
  if (k === 'day') return addD(d, s);
  if (k === 'week') return addD(d, 7 * s);
  const [a] = range(k, d);
  return new Date(a.getFullYear(), a.getMonth() + hOf(k).m * s, 1);
}

export function label(k: HorizonKey, d: Date): string {
  const [s, e] = range(k, d);
  const L = (x: Date, o: Intl.DateTimeFormatOptions) => x.toLocaleDateString(undefined, o);
  if (k === 'day') return L(s, { weekday: 'long', month: 'long', day: 'numeric' });
  if (k === 'week') return L(s, { month: 'short', day: 'numeric' }) + ' – ' + L(addD(e, -1), { month: 'short', day: 'numeric' });
  if (k === 'month') return L(s, { month: 'long', year: 'numeric' });
  if (k === 'quarter') return 'Q' + (Math.floor(s.getMonth() / 3) + 1) + ' ' + s.getFullYear();
  if (k === 'half') return 'H' + (Math.floor(s.getMonth() / 6) + 1) + ' ' + s.getFullYear();
  return String(s.getFullYear());
}

export const inP = (t: { h: HorizonKey; date: string }, k: HorizonKey, d: Date): boolean => {
  if (t.h !== k) return false;
  const [s, e] = range(k, d);
  const x = parse(t.date);
  return x >= s && x < e;
};

export const elapsed = (k: HorizonKey): number => {
  const [s, e] = range(k, new Date());
  const now = new Date().getTime();
  return Math.min(1, Math.max(0, (now - s.getTime()) / (e.getTime() - s.getTime())));
};

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const ldt = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
};

export function fmtRem(s: string): string {
  const d = new Date(s);
  const dd = Math.round((day0(d).getTime() - day0(new Date()).getTime()) / 864e5);
  const dayLabel = dd === 0 ? 'Today' : dd === 1 ? 'Tomorrow' : dd === -1 ? 'Yesterday' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dayLabel} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function nextDate(d: Date, r: string): Date {
  if (r === 'daily') return addD(d, 1);
  if (r === 'weekly') return addD(d, 7);
  const mo = d.getMonth() + (r === 'monthly' ? 1 : 12);
  const y = d.getFullYear();
  return new Date(y, mo, Math.min(d.getDate(), new Date(y, mo + 1, 0).getDate()));
}

export function chime() {
  try {
    const A = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = (f: number, t: number) => {
      const x = A.createOscillator();
      const g = A.createGain();
      const s = A.currentTime + t;
      x.frequency.value = f;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.15, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
      x.connect(g);
      g.connect(A.destination);
      x.start(s);
      x.stop(s + 0.65);
    };
    o(784, 0);
    o(1175, 0.18);
  } catch (e) {}
}
