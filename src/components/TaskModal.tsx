import React, { useState, useEffect } from 'react';
import { Task, HorizonKey, SubTask } from '../types';
import { H, uid, ldt, iso } from '../utils';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  task: Task | null;
  defaultHorizon: HorizonKey;
  tagsList: string[];
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  defaultHorizon,
  tagsList,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [horizon, setHorizon] = useState<HorizonKey>('day');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [tag, setTag] = useState('');
  const [repeat, setRepeat] = useState<any>('none');
  const [reminder, setReminder] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subInput, setSubInput] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.t);
      setHorizon(task.h);
      setDate(task.date);
      setPriority(task.p);
      setTag(task.g || '');
      setRepeat(task.rep || 'none');
      setReminder(task.rem || '');
      setNotes(task.n || '');
      setSubtasks(task.sub ? [...task.sub] : []);
    } else {
      setTitle('');
      setHorizon(defaultHorizon);
      setDate(iso(new Date()) as unknown as string);
      setPriority(2);
      setTag('');
      setRepeat('none');
      setReminder('');
      setNotes('');
      setSubtasks([]);
    }
    setSubInput('');
  }, [task, defaultHorizon, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = subInput.trim();
      if (val) {
        setSubtasks([...subtasks, { id: uid(), t: val, d: false }]);
        setSubInput('');
      }
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleQuickRemind = (type: string) => {
    const n = new Date();
    if (type === '1h') {
      setReminder(ldt(new Date(n.getTime() + 36e5)));
    } else if (type === 'eve') {
      const x = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 20);
      if (x <= n) x.setDate(x.getDate() + 1);
      setReminder(ldt(x));
    } else if (type === 'tom') {
      setReminder(ldt(new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 9)));
    } else if (type === 'clr') {
      setReminder('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const finalSubtasks = subInput.trim() ? [...subtasks, { id: uid(), t: subInput.trim(), d: false }] : subtasks;
    onSave({
      t: title.trim(),
      h: horizon,
      date: date || (iso(new Date()) as unknown as string),
      p: priority,
      g: tag.trim(),
      n: notes.trim(),
      sub: finalSubtasks,
      rep: repeat,
      rem: reminder,
      fired: task && task.rem === reminder ? task.fired : false,
    });
    onClose();
  };

  return (
    <dialog open className="fixed inset-0 z-50 m-auto border border-[var(--line)] rounded-[22px] bg-[var(--surf)] text-[var(--ink)] p-[22px] w-[min(460px,calc(100vw-24px))] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] max-h-[calc(100dvh-24px)] overflow-y-auto backdrop:bg-black/50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[22px] font-bold font-[Bricolage_Grotesque]">{task ? 'Edit plan' : 'New plan'}</h3>
        <button type="button" onClick={onClose} className="ib w-8 h-8 rounded-lg flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className="block text-[13px] font-semibold mt-3 mb-1">What’s the plan?</label>
          <input
            type="text"
            maxLength={140}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Finish the launch checklist"
            className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[13px] font-semibold mt-3 mb-1">Horizon</label>
            <select
              value={horizon}
              onChange={e => setHorizon(e.target.value as HorizonKey)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
            >
              {H.map(x => (
                <option key={x.k} value={x.k}>{x.n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mt-3 mb-1">Date in period</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mt-3 mb-1">Priority</label>
          <div className="flex gap-1.5">
            {([1, 2, 3] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                aria-pressed={priority === p}
                className={`flex-1 border border-[var(--line)] bg-[var(--surf2)] rounded-[10px] p-2 font-medium aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--bg)] aria-pressed:border-[var(--ink)]`}
              >
                {p === 1 ? 'Low' : p === 2 ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mt-3 mb-1">Tag</label>
          <input
            type="text"
            maxLength={24}
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="Work, Health, Money…"
            list="tags-list"
            className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
          />
          <datalist id="tags-list">
            {tagsList.map(g => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[13px] font-semibold mt-3 mb-1">Repeat</label>
            <select
              value={repeat}
              onChange={e => setRepeat(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
            >
              <option value="none">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mt-3 mb-1">Remind me</label>
            <input
              type="datetime-local"
              value={reminder}
              onChange={e => setReminder(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
            />
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mt-1">
          <button type="button" onClick={() => handleQuickRemind('1h')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px] hover:border-[var(--acc)]">In 1 hour</button>
          <button type="button" onClick={() => handleQuickRemind('eve')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px] hover:border-[var(--acc)]">This evening</button>
          <button type="button" onClick={() => handleQuickRemind('tom')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px] hover:border-[var(--acc)]">Tomorrow 9:00</button>
          <button type="button" onClick={() => handleQuickRemind('clr')} className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-3 py-1 text-[13px] hover:border-[var(--acc)]">Clear</button>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mt-3 mb-1">Subtasks</label>
          <div className="grid gap-1 mb-2">
            {subtasks.map(s => (
              <div key={s.id} className="flex justify-between items-center bg-[var(--surf2)] rounded-[10px] p-[6px_10px] text-[13px]">
                <span>{s.t}</span>
                <button type="button" onClick={() => handleRemoveSubtask(s.id)} className="border-0 bg-transparent text-[var(--mute)]">✕</button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={subInput}
            onChange={e => setSubInput(e.target.value)}
            onKeyDown={handleAddSubtask}
            placeholder="Add a subtask, press Enter"
            className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mt-3 mb-1">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Details, links, next steps"
            className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-[10px_12px]"
          />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button type="button" onClick={onClose} className="btn ghost py-2 px-4">Cancel</button>
          <button type="submit" className="btn py-2 px-5">Save plan</button>
        </div>
      </form>
    </dialog>
  );
};
