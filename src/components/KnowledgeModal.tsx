'use client';

import { useEffect, useState } from 'react';
import { Database, Plus, Send, Trash2 } from 'lucide-react';
import { addKnowledgeTopic, deleteKnowledgeTopic, getKnowledge, saveKnowledgeTopic, testBot, type Knowledge, type KnowledgeTopic } from '../api';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';

type Draft = { title: string; content: string };
const field = 'w-full rounded-lg border border-[#E6D9BF] bg-white px-3 py-2 text-sm focus:border-[#CC3316] focus:outline-none';
const ANSWER_HINT = 'Write the answers the bot should give on this topic. Short lines work best, e.g.\nQ: Do you deliver to Pokhara?  A: Yes, Rs 250, 2-4 days.';

// The business owner's own topics: exactly what the auto-reply bot is allowed to tell customers.
// Nothing is fixed: a consultancy adds "Courses" and "Countries", a nail salon "Services & prices".
// Adding and deleting a topic happen at once; edits to titles and answers are saved together with Save.
export function KnowledgeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<Knowledge | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [kind, setKind] = useState('General');
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [question, setQuestion] = useState('');
  const [testing, setTesting] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const draftOf = (t: KnowledgeTopic): Draft => ({ title: t.title, content: t.content });
  const load = () =>
    getKnowledge()
      .then((k) => {
        setData(k);
        setDrafts(Object.fromEntries(k.topics.map((t) => [t.id, draftOf(t)])));
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaved(false);
    setAnswer(null);
    load();
  }, [isOpen]);

  const topics = data?.topics ?? [];
  const dirty = topics.filter((t) => {
    const d = drafts[t.id];
    return d && (d.title.trim() !== t.title || d.content.trim() !== t.content);
  });
  const total = Object.values(drafts).reduce((n, d) => n + d.content.trim().length, 0);
  const hasSaved = topics.some((t) => t.content);
  const have = new Set(topics.map((t) => t.title.toLowerCase()));
  const starters = (data?.suggestions[kind] ?? []).filter((s) => !have.has(s.title.toLowerCase()));

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  // Add/delete patch local state instead of reloading, so unsaved edits in other topics survive.
  const add = (title: string, hint = '') =>
    run(async () => {
      const t = await addKnowledgeTopic(title.trim(), hint);
      setData((d) => d && { ...d, topics: [...d.topics, t] });
      setDrafts((all) => ({ ...all, [t.id]: draftOf(t) }));
      setNewTitle('');
    });
  const remove = (t: KnowledgeTopic) =>
    confirm(`Delete the topic "${t.title}"? The bot stops using it.`) &&
    run(async () => {
      await deleteKnowledgeTopic(t.id);
      setData((d) => d && { ...d, topics: d.topics.filter((x) => x.id !== t.id) });
      setDrafts(({ [t.id]: _, ...rest }) => rest);
    });
  const save = () =>
    run(async () => {
      setSaved(false);
      for (const t of dirty) await saveKnowledgeTopic(t.id, drafts[t.id].title.trim() || t.title, drafts[t.id].content);
      await load();
      setSaved(true);
    });
  const ask = async () => {
    setTesting(true);
    setAnswer(null);
    await run(async () => setAnswer((await testBot(question.trim())).reply));
    setTesting(false);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Shop Info for Auto-Reply" icon={Database} size="xl">
      <div className="p-4 overflow-y-auto space-y-4 text-sm">
        {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</p>}

        {!data ? (
          <div role="status" aria-label="Loading shop info" className="space-y-3">
            <Skeleton className="h-16 w-full" />
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E6D9BF] bg-[#FFFBF2] p-3">
              <div>
                <p className="font-semibold">AI auto-reply is {data.ai_enabled ? 'on' : 'off'}</p>
                <p className="text-xs text-[#6B5D4F]">
                  When on, Sanchar answers customers on your connected channels using only the topics below. When you reply to a
                  customer yourself, it stays quiet for 10 minutes, then takes over again. Sanchar support switches this for you.
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${data.ai_enabled ? 'bg-[#DDF5E8] text-[#11643D]' : 'bg-[#EFE6D4] text-[#6B5D4F]'}`}>
                {data.ai_enabled ? 'On' : 'Off'}
              </span>
            </div>

            <p className="text-[#6B5D4F]">
              Add a topic for each thing your customers ask about, and write the answers the bot should give. The bot only
              knows what is written here, so keep prices and details up to date.
            </p>

            {topics.length === 0 && <p className="rounded-xl bg-[#F1E6CC]/60 p-3 text-xs">No topics yet. Pick some starters below or add your own.</p>}
            {topics.map((t) => {
              const d = drafts[t.id] ?? draftOf(t);
              const set = (patch: Partial<Draft>) => {
                setDrafts({ ...drafts, [t.id]: { ...d, ...patch } });
                setSaved(false);
              };
              return (
                <section key={t.id} className="space-y-2 rounded-2xl border border-[#E6D9BF] bg-[#FFFBF2] p-3">
                  <div className="flex items-center gap-2">
                    <input className={`${field} font-semibold`} value={d.title} onChange={(e) => set({ title: e.target.value })} aria-label="Topic title" />
                    <button
                      className="shrink-0 cursor-pointer p-2 text-[#B8251B] disabled:opacity-40"
                      disabled={busy}
                      onClick={() => remove(t)}
                      aria-label={`Delete topic ${t.title}`}
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={d.content}
                    onChange={(e) => set({ content: e.target.value })}
                    placeholder={t.hint || ANSWER_HINT}
                    rows={Math.min(10, Math.max(3, d.content.split('\n').length + 1))}
                    className={field}
                    aria-label={`Answers for ${t.title}`}
                  />
                </section>
              );
            })}

            <section className="space-y-3 rounded-2xl border border-dashed border-[#CC3316]/40 p-3">
              <h3 className="font-semibold">Add a topic</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#6B5D4F]">Suggestions for</span>
                <select className={`${field} w-auto`} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Business type">
                  {Object.keys(data.suggestions).map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {starters.map((s) => (
                  <button
                    key={s.title}
                    className="matchbox-button-secondary cursor-pointer px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    disabled={busy}
                    onClick={() => add(s.title, s.hint)}
                    title={s.hint}
                  >
                    <Plus className="mr-1 inline h-3 w-3" />
                    {s.title}
                  </button>
                ))}
                {starters.length === 0 && <span className="text-xs text-[#6B5D4F]">All {kind} suggestions are added.</span>}
              </div>
              <div className="flex gap-2">
                <input
                  className={field}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && !busy && add(newTitle)}
                  placeholder="Your own topic, e.g. Visa success rate, Bridal nail packages"
                  aria-label="New topic title"
                />
                <button className="matchbox-button-primary shrink-0 cursor-pointer px-3 py-1.5 text-xs font-semibold disabled:opacity-50" disabled={busy || !newTitle.trim()} onClick={() => add(newTitle)}>
                  Add topic
                </button>
              </div>
            </section>

            <section className="space-y-2 rounded-2xl border border-[#E6D9BF] bg-[#FFFBF2] p-3">
              <h3 className="font-semibold">Try it</h3>
              <p className="text-xs text-[#6B5D4F]">Ask what a customer would. It answers from your <b>saved</b> topics. Nothing is sent to anyone.</p>
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
                  title={dirty.length ? 'Save your changes first' : !hasSaved ? 'Save some answers first' : undefined}
                  className="matchbox-button-primary flex shrink-0 cursor-pointer items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                  {testing ? 'Asking…' : 'Ask'}
                </button>
              </div>
              {answer && <div className="whitespace-pre-line rounded-lg bg-[#F1E6CC]/60 p-2">{answer}</div>}
            </section>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E6D9BF] bg-[#FFFBF2] p-3 text-xs">
        <span className={data && total > data.max_chars ? 'font-semibold text-[#B8251B]' : 'text-[#6B5D4F]'}>
          {data ? `${total.toLocaleString()} / ${data.max_chars.toLocaleString()} characters` : ''}
          {saved && <span className="ml-2 font-semibold text-[#11643D]">Saved ✓</span>}
        </span>
        <button
          onClick={save}
          disabled={busy || dirty.length === 0 || (data ? total > data.max_chars : true)}
          className="matchbox-button-primary cursor-pointer px-4 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && dirty.length ? 'Saving…' : dirty.length ? `Save ${dirty.length} change${dirty.length > 1 ? 's' : ''}` : 'Saved'}
        </button>
      </div>
    </Modal>
  );
}
