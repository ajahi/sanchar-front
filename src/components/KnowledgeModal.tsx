'use client';

import { useEffect, useState } from 'react';
import { Database, Send } from 'lucide-react';
import { getKnowledge, saveKnowledgeSection, setAiEnabled, testBot, type Knowledge } from '../api';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';

type Reply = { reply: string; handover: boolean; reason: string };

// The business owner's shop info: exactly what the auto-reply bot is allowed to tell customers.
// Loads on open; Save writes only the sections that changed.
export function KnowledgeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<Knowledge | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const [testing, setTesting] = useState(false);
  const [answer, setAnswer] = useState<Reply | null>(null);

  const load = () =>
    getKnowledge()
      .then((k) => {
        setData(k);
        setDrafts(Object.fromEntries(k.sections.map((s) => [s.key, s.content])));
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaved(false);
    setAnswer(null);
    load();
  }, [isOpen]);

  const dirty = data?.sections.filter((s) => (drafts[s.key] ?? '').trim() !== s.content) ?? [];
  const total = Object.values(drafts).reduce((n, t) => n + t.trim().length, 0);
  const hasSaved = data?.sections.some((s) => s.content) ?? false;

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await run(async () => {
      for (const s of dirty) await saveKnowledgeSection(s.key, drafts[s.key] ?? '');
      await load();
      setSaved(true);
    });
    setSaving(false);
  };

  const toggleAi = async () => {
    if (!data) return;
    setAiBusy(true);
    await run(async () => {
      await setAiEnabled(!data.ai_enabled);
      setData({ ...data, ai_enabled: !data.ai_enabled });
    });
    setAiBusy(false);
  };

  const ask = async () => {
    setTesting(true);
    setAnswer(null);
    await run(async () => setAnswer(await testBot(question.trim())));
    setTesting(false);
  };

  const field = 'w-full p-2 border-2 border-black bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#B8251B]';

  return (
    <Modal open={isOpen} onClose={onClose} title="Shop Info for Auto-Reply" icon={Database} size="xl">
      <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
        {error && <p role="alert" className="font-bold text-[#B8251B]">{error}</p>}

        {!data ? (
          <div role="status" aria-label="Loading shop info" className="space-y-3">
            <Skeleton className="h-16 w-full" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="matchbox-border bg-white p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-black uppercase">AI auto-reply is {data.ai_enabled ? 'ON' : 'OFF'}</p>
                <p className="text-[10px] text-stone-600">
                  When on, Sanchar answers customers on your connected channels using only the info below, and passes
                  anything it is unsure about to you.
                </p>
              </div>
              <button
                onClick={toggleAi}
                disabled={aiBusy || (!data.ai_enabled && !hasSaved)}
                title={!data.ai_enabled && !hasSaved ? 'Save some shop info first' : undefined}
                aria-pressed={data.ai_enabled}
                className={`pill shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  data.ai_enabled ? 'bg-emerald-800 text-white' : 'aged-paper text-black'
                }`}
              >
                {data.ai_enabled ? 'Turn off' : 'Turn on'}
              </button>
            </div>

            <p className="text-stone-700">
              Fill in what customers ask about. The bot only knows what is written here, so keep prices, stock and
              policies up to date.
            </p>

            {data.sections.map((s) => (
              <div key={s.key}>
                <label htmlFor={`k-${s.key}`} className="block text-[10px] font-bold uppercase mb-1">
                  {s.label}
                </label>
                <textarea
                  id={`k-${s.key}`}
                  value={drafts[s.key] ?? ''}
                  onChange={(e) => {
                    setDrafts({ ...drafts, [s.key]: e.target.value });
                    setSaved(false);
                  }}
                  placeholder={s.hint}
                  rows={s.key === 'products' ? 6 : 3}
                  className={field}
                />
              </div>
            ))}

            <div className="matchbox-border bg-white p-3 space-y-2">
              <p className="font-black uppercase">Try it</p>
              <p className="text-[10px] text-stone-600">
                Ask it what a customer would. It answers from your <b>saved</b> info. Nothing is sent to anyone.
              </p>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && question.trim() && dirty.length === 0 && !testing && ask()}
                  placeholder="e.g. pp, delivery Pokhara ma huncha?"
                  className={field}
                />
                <button
                  onClick={ask}
                  disabled={testing || !question.trim() || dirty.length > 0 || !hasSaved}
                  title={dirty.length ? 'Save your changes first' : !hasSaved ? 'Save some shop info first' : undefined}
                  className="pill vermilion-bg text-white cursor-pointer flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                  {testing ? 'Asking…' : 'Ask'}
                </button>
              </div>
              {answer && (
                <div className="p-2 border-2 border-black bg-[#FAF3E0] space-y-1">
                  <p>{answer.reply}</p>
                  {answer.handover && (
                    <p className="text-[10px] font-bold text-[#B8251B]">
                      ↪ Would be passed to you{answer.reason ? `: ${answer.reason}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-3 bg-white border-t-2 border-black flex justify-between items-center gap-3 text-[10px] shrink-0">
        <span className={data && total > data.max_chars ? 'text-[#B8251B] font-bold' : ''}>
          {data ? `${total.toLocaleString()} / ${data.max_chars.toLocaleString()} characters` : ''}
          {saved && <span className="ml-2 font-bold text-emerald-800">Saved ✓</span>}
        </span>
        <button
          onClick={save}
          disabled={saving || dirty.length === 0 || (data ? total > data.max_chars : true)}
          className="vermilion-bg text-white font-bold px-4 py-1.5 border-2 border-black shadow-[2px_2px_0px_black] hover:bg-[#8F1810] cursor-pointer uppercase text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : dirty.length ? `Save ${dirty.length} change${dirty.length > 1 ? 's' : ''}` : 'Saved'}
        </button>
      </div>
    </Modal>
  );
}
