import React, { useState } from 'react';
import { Task } from '../types';
import { Sparkles, Loader2, X, PlusCircle } from 'lucide-react';
import { uid, iso } from '../utils';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlans: (newTasks: Task[], summary: string) => void;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({ isOpen, onClose, onImportPlans }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ summary: string; plans: any[] } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate AI plan');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!result || !result.plans) return;
    const todayStr = iso(new Date());
    const mappedTasks: Task[] = result.plans.map((p: any) => ({
      id: uid(),
      t: p.t || 'Untitled Plan',
      h: p.h || 'day',
      date: todayStr,
      p: p.p || 2,
      g: p.g || 'AI Coach',
      n: p.n || '',
      done: false,
      doneAt: null,
      sub: (p.sub || []).map((s: any) => ({ id: uid(), t: s.t, d: false })),
      rep: 'none',
    }));
    onImportPlans(mappedTasks, result.summary);
    onClose();
    setPrompt('');
    setResult(null);
  };

  return (
    <dialog open className="fixed inset-0 z-50 m-auto border border-[var(--line)] rounded-[22px] bg-[var(--surf)] text-[var(--ink)] p-6 w-[min(540px,calc(100vw-24px))] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop:bg-black/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[22px] font-bold font-[Bricolage_Grotesque] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          AI Horizon Coach
        </h3>
        <button onClick={onClose} className="ib w-8 h-8 rounded-lg flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[14px] text-[var(--mute)] mb-4">
        Describe your ultimate goal, dream, or project. Cadence AI will build a structured roadmap across your Day, Week, Month, Quarter, Half-year, and Year horizons.
      </p>

      <form onSubmit={handleGenerate} className="grid gap-3">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Build and launch a profitable SaaS micro-business in 6 months..."
          className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-[11px] p-3 text-[14px]"
          required
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn ghost py-2 px-4">Cancel</button>
          <button type="submit" disabled={loading} className="btn flex items-center gap-2 py-2 px-5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Synthesizing...' : 'Generate Roadmap'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-500 text-[13px] mt-3">{error}</p>}

      {result && (
        <div className="mt-6 border-t border-[var(--line)] pt-4 max-h-[300px] overflow-y-auto">
          <p className="text-[14px] font-medium text-[var(--ink)] mb-2 italic bg-[var(--surf2)] p-3 rounded-xl border border-[var(--line)]">
            "{result.summary}"
          </p>
          <h4 className="font-bold text-[14px] mb-2 text-[var(--mute)]">{result.plans.length} strategic milestones generated:</h4>
          <div className="grid gap-2 mb-4">
            {result.plans.map((p, idx) => (
              <div key={idx} className="bg-[var(--surf2)] border border-[var(--line)] rounded-xl p-3 text-[13px]">
                <div className="flex justify-between items-center font-semibold">
                  <span>{p.t}</span>
                  <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-[var(--surf)] border border-[var(--line)]">{p.h}</span>
                </div>
                {p.n && <p className="text-[var(--mute)] mt-1">{p.n}</p>}
              </div>
            ))}
          </div>
          <button onClick={handleAccept} className="btn w-full flex items-center justify-center gap-2 py-2.5">
            <PlusCircle className="w-4 h-4" />
            Import Roadmap into Cadence
          </button>
        </div>
      )}
    </dialog>
  );
};
