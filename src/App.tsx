/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Task, HorizonKey, Preferences, ViewMode } from './types';
import { H, PC, iso, parse, day0, addD, range, shift, ldt, chime, fmtRem, esc } from './utils';
import { Header } from './components/Header';
import { HeroRings } from './components/HeroRings';
import { HorizonNav } from './components/HorizonNav';
import { ViewToggle } from './components/ViewToggle';
import { TaskListView } from './components/TaskListView';
import { CalendarView } from './components/CalendarView';
import { InsightsView } from './components/InsightsView';
import { TaskModal } from './components/TaskModal';
import { AICoachModal } from './components/AICoachModal';
import { RemindersDrawer } from './components/RemindersDrawer';
import { Toast } from './components/Toast';
import { Plus } from 'lucide-react';

const KEY = 'cadence.v1';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pref, setPref] = useState<Preferences>({ theme: '' });
  const [viewH, setViewH] = useState<HorizonKey>('day');
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [vmode, setVmode] = useState<ViewMode>('list');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [toastData, setToastData] = useState<{ message: string; undoFn: (() => void) | null; show: boolean }>({ message: '', undoFn: null, show: false });
  const [alerts, setAlerts] = useState<Task[]>([]);

  const toastTimer = useRef<any>(null);

  // Load state
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r) {
        setTasks(r.tasks || []);
        setPref(r.pref || { theme: '' });
        return;
      }
    } catch (e) {}

    // Default seed tasks if none
    const T = new Date();
    const mk = (t: string, h: HorizonKey, p: 1 | 2 | 3, g: string, n: string, done?: number): Task => ({
      id: Math.random().toString(36).slice(2, 9),
      t,
      h,
      date: iso(T) as unknown as string,
      p,
      g,
      n,
      done: !!done,
      doneAt: done ? (iso(T) as unknown as string) : null,
    });

    const sid = () => Math.random().toString(36).slice(2, 9);
    const initialTasks: Task[] = [
      mk('Morning run + stretch', 'day', 2, 'Health', '30 minutes before breakfast', 1),
      mk('Reply to priority emails', 'day', 3, 'Work', 'Inbox zero by noon'),
      mk('Plan tomorrow in 5 minutes', 'day', 1, 'Routine', ''),
      mk('Ship the weekly report', 'week', 3, 'Work', 'Draft Wednesday, send Friday'),
      mk('Meal-prep for 4 days', 'week', 2, 'Health', ''),
      mk('Call family', 'week', 1, 'Life', ''),
      mk('Review monthly budget', 'month', 2, 'Money', 'Tag recurring subscriptions'),
      mk('Read two books', 'month', 1, 'Growth', ''),
      mk('Launch v2 of the side project', 'quarter', 3, 'Work', 'Beta by week 6'),
      mk('Build a 3-month emergency fund', 'quarter', 2, 'Money', ''),
      mk('Run a half marathon', 'half', 3, 'Health', 'Training plan starts in 8 weeks'),
      mk('Take a real vacation', 'year', 2, 'Life', 'Book flights early'),
      mk('Learn a new language to B1', 'year', 2, 'Growth', ''),
    ];

    initialTasks[0].rep = 'daily';
    initialTasks[1].sub = [{ id: sid(), t: 'Clients first', d: true }, { id: sid(), t: 'Team threads', d: false }, { id: sid(), t: 'Archive the rest', d: false }];
    initialTasks[1].rem = ldt(new Date(Date.now() + 12e4));
    initialTasks[3].rep = 'weekly';
    initialTasks[3].sub = [{ id: sid(), t: 'Pull the numbers', d: false }, { id: sid(), t: 'Write highlights', d: false }];

    setTasks(initialTasks);
  }, []);

  // Save state
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ tasks, pref }));
    } catch (e) {}
  }, [tasks, pref]);

  // Theme effect
  useEffect(() => {
    if (pref.theme) {
      document.documentElement.dataset.theme = pref.theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [pref.theme]);

  const showToast = (message: string, undoFn: (() => void) | null = null) => {
    setToastData({ message, undoFn, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastData(prev => ({ ...prev, show: false }));
    }, 4200);
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.dataset.theme === 'dark' || (!pref.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setPref({ theme: isDark ? 'light' : 'dark' });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ tasks, pref }, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-backup-${iso(new Date())}.json`;
    a.click();
    showToast('Backup exported');
  };

  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      f.text().then(text => {
        try {
          const r = JSON.parse(text);
          if (!Array.isArray(r.tasks)) throw new Error();
          setTasks(r.tasks);
          showToast('Backup imported');
        } catch (_2) {
          showToast('That file isn’t a Cadence backup');
        }
      });
    };
    fileInput.click();
  };

  // Reminders check loop
  useEffect(() => {
    const checkReminders = () => {
      const n = new Date();
      let triggeredAny = false;
      const newlyFired: Task[] = [];

      const updated = tasks.map(t => {
        if (!t.done && t.rem && !t.fired && new Date(t.rem) <= n) {
          triggeredAny = true;
          newlyFired.push({ ...t, fired: true });
          return { ...t, fired: true };
        }
        return t;
      });

      if (triggeredAny) {
        setTasks(updated);
        chime();
        if ('Notification' in window && Notification.permission === 'granted') {
          newlyFired.forEach(t => {
            try {
              new Notification(`⏰ ${t.t}`, { body: t.n || 'Reminder from Cadence' });
            } catch (e) {}
          });
        }
        setAlerts(prev => [...prev, ...newlyFired]);
      }
    };

    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleAlertAction = (taskId: string, actionKey: string) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    const updated = tasks.map(x => {
      if (x.id === taskId) {
        if (actionKey === 'done') {
          return { ...x, done: true, doneAt: iso(new Date()) as unknown as string };
        } else if (actionKey === 'tom') {
          const n = new Date();
          return { ...x, rem: ldt(new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 9)), fired: false };
        } else if (actionKey !== 'x') {
          return { ...x, rem: ldt(new Date(Date.now() + Number(actionKey) * 6e4)), fired: false };
        }
      }
      return x;
    });

    setTasks(updated);
    setAlerts(prev => prev.filter(a => a.id !== taskId));
  };

  // Toggle task completion
  const handleToggleTask = (id: string, e: React.MouseEvent) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    const nextDone = !targetTask.done;
    const doneAtVal = nextDone ? (iso(new Date()) as unknown as string) : null;

    let newTasks = tasks.map(t => (t.id === id ? { ...t, done: nextDone, doneAt: doneAtVal } : t));

    // Spawn next repeat if completed
    if (nextDone && targetTask.rep && targetTask.rep !== 'none' && !targetTask.spawned) {
      const c = parse(targetTask.date);
      const nextD = (r: string, d: Date) => {
        if (r === 'daily') return addD(d, 1);
        if (r === 'weekly') return addD(d, 7);
        const mo = d.getMonth() + (r === 'monthly' ? 1 : 12);
        const y = d.getFullYear();
        return new Date(y, mo, Math.min(d.getDate(), new Date(y, mo + 1, 0).getDate()));
      };
      const nDate = nextD(targetTask.rep, c);
      const spawnedTask: Task = {
        ...targetTask,
        id: Math.random().toString(36).slice(2, 9),
        done: false,
        doneAt: null,
        spawned: false,
        fired: false,
        date: iso(nDate) as unknown as string,
        sub: (targetTask.sub || []).map(s => ({ ...s, d: false })),
      };
      if (targetTask.rem) {
        spawnedTask.rem = ldt(new Date(new Date(targetTask.rem).getTime() + (nDate.getTime() - c.getTime())));
      }
      newTasks = newTasks.map(t => (t.id === id ? { ...t, spawned: true } : t));
      newTasks.push(spawnedTask);
      showToast(`Next ${targetTask.rep} plan set for ${nDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`);
    }

    setTasks(newTasks);
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        sub: (t.sub || []).map(s => (s.id === subId ? { ...s, d: !s.d } : s)),
      };
    }));
  };

  const handleDeleteTask = (id: string) => {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const removed = tasks[idx];
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    showToast('Plan deleted', () => {
      const restored = [...newTasks];
      restored.splice(idx, 0, removed);
      setTasks(restored);
    });
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(tasks.map(t => (t.id === editingTask.id ? { ...t, ...taskData } : t)));
      showToast('Plan updated');
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).slice(2, 9),
        done: false,
        doneAt: null,
        t: taskData.t || '',
        h: taskData.h || viewH,
        date: taskData.date || (iso(new Date()) as unknown as string),
        p: taskData.p || 2,
        g: taskData.g || '',
        n: taskData.n || '',
        sub: taskData.sub || [],
        rep: taskData.rep || 'none',
        rem: taskData.rem || '',
      };
      setTasks([...tasks, newTask]);
      if (newTask.h !== viewH || !range(newTask.h, parse(newTask.date))) {
        setViewH(newTask.h);
        setViewDate(parse(newTask.date));
      }
      showToast('Plan added');
    }
    setEditingTask(null);
  };

  const handleRollover = () => {
    const n = new Date();
    const [s, en] = range(viewH, n);
    const dt = iso(n >= s && n < en ? n : s) as unknown as string;
    const updated = tasks.map(t => {
      if (!t.done && t.h === viewH) {
        const [ps, pe] = range(viewH, shift(viewH, viewDate, -1));
        const x = parse(t.date);
        if (x >= ps && x < pe) {
          return { ...t, date: dt };
        }
      }
      return t;
    });
    setTasks(updated);
    showToast('Plans rolled over');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,select') || isTaskModalOpen || isAICoachOpen || e.metaKey || e.ctrlKey) return;
      if (e.key === 'n') {
        e.preventDefault();
        setEditingTask(null);
        setIsTaskModalOpen(true);
      } else if (e.key === 'ArrowLeft') {
        setViewDate(prev => shift(vmode === 'cal' ? 'month' : viewH, prev, -1));
      } else if (e.key === 'ArrowRight') {
        setViewDate(prev => shift(vmode === 'cal' ? 'month' : viewH, prev, 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isTaskModalOpen, isAICoachOpen, viewH, vmode]);

  const tagsList = [...new Set(tasks.map(t => t.g).filter(Boolean))] as string[];
  const reminderCount = tasks.filter(t => !t.done && t.rem && !t.fired).length + alerts.length;

  return (
    <div className="wrap max-w-[1040px] mx-auto p-4">
      <Header
        theme={pref.theme}
        onToggleTheme={toggleTheme}
        onExport={handleExport}
        onImport={handleImport}
        onToggleReminders={() => setIsRemindersOpen(!isRemindersOpen)}
        onOpenAICoach={() => setIsAICoachOpen(true)}
        onNewPlan={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
        reminderCount={reminderCount}
      />

      <HeroRings
        tasks={tasks}
        onSelectHorizon={h => {
          setViewH(h);
          setViewDate(new Date());
          setVmode('list');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {vmode === 'list' && (
        <HorizonNav
          currentHorizon={viewH}
          onSelectHorizon={h => {
            setViewH(h);
            setViewDate(new Date());
          }}
        />
      )}

      <ViewToggle viewMode={vmode} onSelectViewMode={setVmode} />

      <section className="panel bg-[var(--surf)] border border-[var(--line)] rounded-[22px] shadow-[var(--shadow)] overflow-hidden">
        {vmode === 'list' && (
          <TaskListView
            tasks={tasks}
            horizon={viewH}
            viewDate={viewDate}
            onPrevPeriod={() => setViewDate(prev => shift(viewH, prev, -1))}
            onNextPeriod={() => setViewDate(prev => shift(viewH, prev, 1))}
            onToday={() => setViewDate(new Date())}
            onToggleTask={handleToggleTask}
            onToggleSubtask={handleToggleSubtask}
            onEditTask={t => { setEditingTask(t); setIsTaskModalOpen(true); }}
            onDeleteTask={handleDeleteTask}
            onRollover={handleRollover}
          />
        )}
        {vmode === 'cal' && (
          <CalendarView
            tasks={tasks}
            viewDate={viewDate}
            onSelectDay={dStr => {
              setViewH('day');
              setViewDate(parse(dStr));
              setVmode('list');
            }}
          />
        )}
        {vmode === 'ins' && (
          <InsightsView
            tasks={tasks}
            streak={(() => {
              const s = new Set(tasks.filter(t => t.doneAt).map(t => t.doneAt));
              let d = day0(new Date());
              let n = 0;
              const isoD = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
              if (!s.has(isoD(d) as any)) d = addD(d, -1);
              while (s.has(isoD(d) as any)) {
                n++;
                d = addD(d, -1);
              }
              return n;
            })()}
          />
        )}
      </section>

      {/* Floating Action Button */}
      <button
        onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
        className="btn fab fixed right-[18px] bottom-[calc(18px+env(safe-area-inset-bottom,0px))] w-[56px] h-[56px] rounded-full text-[28px] p-0 z-25 md:hidden flex items-center justify-center shadow-lg"
        aria-label="New plan"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        defaultHorizon={viewH}
        tagsList={tagsList}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
      />

      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        onImportPlans={(newTasks, summary) => {
          setTasks(prev => [...prev, ...newTasks]);
          showToast(`Imported AI Roadmap: ${summary}`);
        }}
      />

      <RemindersDrawer
        isOpen={isRemindersOpen}
        tasks={tasks}
        onClose={() => setIsRemindersOpen(false)}
        onRequestNotificationPermission={() => {
          if ('Notification' in window) {
            Notification.requestPermission().then(() => setIsRemindersOpen(true));
          }
        }}
        onSnooze={(taskId, mins) => {
          const updated = tasks.map(t => {
            if (t.id === taskId) {
              if (mins === 'x') {
                return { ...t, rem: '', fired: false };
              }
              return { ...t, rem: ldt(new Date(Date.now() + (mins as number) * 6e4)), fired: false };
            }
            return t;
          });
          setTasks(updated);
        }}
        onSelectTask={t => {
          setViewH(t.h);
          setViewDate(parse(t.date));
          setVmode('list');
          setEditingTask(t);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Alert Banners for fired reminders */}
      <div id="alerts" className="fixed top-[calc(12px+env(safe-area-inset-top,0px))] right-[12px] left-[12px] max-w-[380px] ml-auto grid gap-2.5 z-70">
        {alerts.map(t => (
          <div
            key={t.id}
            className="al bg-[var(--surf)]/90 backdrop-blur-lg border border-[var(--line)] rounded-[18px] p-3.5 shadow-2xl animate-[sl_0.55s_cubic-bezier(0.2,0.9,0.3,1.2)]"
            style={{ borderLeft: `5px solid ${PC[t.p]}` }}
          >
            <div className="flex gap-2.5 items-center">
              <span className="text-2xl">🔔</span>
              <div>
                <b className="block text-[14px]">{esc(t.t)}</b>
                <small className="text-[12px] text-[var(--mute)]">{fmtRem(t.rem!)}{t.g ? ` · ${esc(t.g)}` : ''}</small>
              </div>
            </div>
            {t.n && <p className="text-[13px] text-[var(--mute)] mt-2">{esc(t.n)}</p>}
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              <button onClick={() => handleAlertAction(t.id, 'done')} className="pr bg-[var(--acc)] text-white border-0 rounded-full px-3 py-1 text-[13px]">Mark done</button>
              <button onClick={() => handleAlertAction(t.id, '10')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px]">+10 min</button>
              <button onClick={() => handleAlertAction(t.id, '60')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px]">+1 hour</button>
              <button onClick={() => handleAlertAction(t.id, 'tom')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px]">Tomorrow</button>
              <button onClick={() => handleAlertAction(t.id, 'x')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px]">Dismiss</button>
            </div>
          </div>
        ))}
      </div>

      <Toast message={toastData.message} show={toastData.show} onUndo={toastData.undoFn} onClose={() => setToastData(prev => ({ ...prev, show: false }))} />
    </div>
  );
}
