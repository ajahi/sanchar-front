'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { getDashboard, type ChannelCounts, type Dashboard } from '../api';

const LABELS: Record<keyof ChannelCounts, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

function Counts({ title, hint, counts }: { title: string; hint: string; counts: ChannelCounts }) {
  return (
    <section className="matchbox-border bg-white p-3">
      <h3 className="text-xs font-black uppercase tracking-widest">{title}</h3>
      <p className="text-[10px] text-stone-600 mb-2">{hint}</p>
      {(Object.keys(LABELS) as (keyof ChannelCounts)[]).map((ch) => (
        <p key={ch} className="flex justify-between py-0.5">
          <span>{LABELS[ch]}</span>
          <span className="font-bold tabular-nums">{counts[ch]}</span>
        </p>
      ))}
    </section>
  );
}

// Native <dialog>, same pattern as ProfileModal. Refetches whenever it opens or the range changes.
export function DashboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [days, setDays] = useState(1);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return ref.current?.close();
    if (!ref.current?.open) ref.current?.showModal();
    setError(null);
    getDashboard(days).then(setData).catch((e) => setError(e.message));
  }, [open, days]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[94vw] max-w-2xl max-h-[90vh] p-0 matchbox-border bg-[#FAF3E0] text-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] backdrop:bg-black/60 select-text"
    >
      <div className="flex flex-col max-h-[90vh]">
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-300" />
            <h2 className="serif-heading text-lg tracking-tight">Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-stone-700">A quick look at how your channels are doing.</p>
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  aria-pressed={days === r.days}
                  className={`pill cursor-pointer ${days === r.days ? 'mustard-bg text-black shadow-[2px_2px_0px_#1A1A1A]' : 'aged-paper text-black'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-[#B8251B] font-bold">{error}</p>
          ) : !data ? (
            <p className="text-stone-600">Loading…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Counts title="New messages" hint="Messages customers sent you." counts={data.new_messages} />
              <section className="matchbox-border bg-white p-3">
                <h3 className="text-xs font-black uppercase tracking-widest">Top queries</h3>
                <p className="text-[10px] text-stone-600 mb-2">What customers ask most. Add these to your catalog or FAQs.</p>
                {data.top_queries.length === 0 && <p className="text-stone-600">No queries yet</p>}
                <ol className="list-decimal list-inside space-y-1">
                  {data.top_queries.map((q) => (
                    <li key={q.text}>
                      {q.text} <span className="text-stone-600">({q.count})</span>
                    </li>
                  ))}
                </ol>
              </section>
              <Counts title="Messages handled" hint="Replied to by Sanchar automatically." counts={data.messages_handled} />
              <Counts title="Handover" hint="Passed to you because the AI wasn't sure. Check the Inbox." counts={data.handover} />
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 vermilion-bg text-white font-serif font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#1A1A1A] cursor-pointer"
          >
            Go to conversations →
          </button>
        </div>
      </div>
    </dialog>
  );
}
