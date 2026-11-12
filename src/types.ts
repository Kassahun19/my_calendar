export type HorizonKey = 'day' | 'week' | 'month' | 'quarter' | 'half' | 'year';

export interface HorizonDef {
  k: HorizonKey;
  n: string;
  c: string;
  m: number; // months multiplier for quarter/half/year, 0 for day/week
}

export interface SubTask {
  id: string;
  t: string;
  d: boolean;
}

export interface Task {
  id: string;
  t: string; // title
  h: HorizonKey; // horizon
  date: string; // YYYY-MM-DD
  p: 1 | 2 | 3; // priority: 1=Low, 2=Medium, 3=High
  g?: string; // tag/group
  n?: string; // notes
  done: boolean;
  doneAt?: string | null; // YYYY-MM-DD
  sub?: SubTask[];
  rep?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  rem?: string; // datetime-local string
  fired?: boolean;
  spawned?: boolean;
}

export interface Preferences {
  theme: '' | 'light' | 'dark';
}

export type ViewMode = 'list' | 'cal' | 'ins' | 'ai';
