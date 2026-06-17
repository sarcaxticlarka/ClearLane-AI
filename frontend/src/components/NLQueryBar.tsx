import { useState } from 'react';
import { api } from '../lib/api';
import { useDashboardStore } from '../store/useDashboardStore';

const SUGGESTIONS = [
  'Which zone needs the most officers right now?',
  'What is the highest-risk anomaly today?',
  'Where should patrols focus during evening peak?',
];

export function NLQueryBar() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectZone = useDashboardStore((s) => s.selectZone);

  const submit = async (q?: string) => {
    const text = q ?? question;
    if (!text.trim()) return;
    setQuestion(text);
    setLoading(true);
    setAnswer(null);
    try {
      const res = await api.postQuery(text);
      setAnswer(res.answer);
      if (res.referenced_zone_ids.length > 0) {
        selectZone(res.referenced_zone_ids[0]);
      }
    } catch {
      setAnswer('Something went wrong answering that question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel relative z-10 flex flex-col gap-2 border-t border-white/10 px-5 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-500/30">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-cyan-300" fill="currentColor">
            <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
          </svg>
        </div>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          placeholder="Ask ClearLane AI: e.g. Which zone needs enforcement first?"
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-gray-600 transition focus:border-cyan-400/50 focus:bg-white/[0.05] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 animate-bounce rounded-full bg-black [animation-delay:-0.3s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-black [animation-delay:-0.15s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-black" />
            </span>
          ) : (
            'Ask'
          )}
        </button>
      </div>

      {!answer && !loading && (
        <div className="flex gap-2 pl-9">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void submit(s)}
              className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[11px] text-gray-500 transition hover:border-cyan-400/30 hover:text-gray-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <p className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-gray-200">
          {answer}
        </p>
      )}
    </div>
  );
}
