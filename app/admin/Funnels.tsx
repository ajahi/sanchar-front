'use client';

// Conversation funnels (backend services/funnels.py): edit a funnel, try it on a tenant's shop info before
// saving, save it as a new live version, or make an older version live again (rollback).
import { useState } from 'react';
import {
  adminActivateFunnel, adminFunnelFromMd, adminFunnelToMd, adminSaveFunnel, adminTryFunnel, type AdminTenant, type Funnel, type FunnelDraft,
} from '../../src/api';

const TRIGGERS = ['save_order', 'notify', 'website_post'];
const HOURS_MESSAGE = 'Hami ahile banda chau, {opens} dekhi order lina sakchau.';
const BLANK: FunnelDraft = {
  key: '', name: '', label: 'order', steps: '', triggers: ['save_order'], checks: [],
  fields: [
    { key: 'name', label: 'name', required: true, max: 100 },
    { key: 'phone', label: 'phone', required: true, max: 50 },
    { key: 'address', label: 'address', required: true, max: 300 },
    { key: 'items', label: 'items with quantity', required: true, max: 500 },
    { key: 'requests', label: 'special request, or none', required: false, max: 300 },
  ],
};
const input = 'w-full p-2 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[#B8251B]';
const label = 'text-[10px] uppercase tracking-widest text-stone-600';

const pick = ({ key, name, label, steps, fields, triggers, checks }: FunnelDraft): FunnelDraft =>
  ({ key, name, label, steps, fields, triggers, checks });

export function Funnels({ funnels, tenants, reload }: { funnels: Funnel[]; tenants: AdminTenant[]; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState<FunnelDraft | null>(null);
  const [fieldsText, setFieldsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<[string, string][]>([]);

  const open = (f: FunnelDraft) => {
    setDraft(pick({ ...BLANK, ...f }));
    setFieldsText(JSON.stringify(f.fields ?? BLANK.fields, null, 2));
    setChat([]);
    setError(null);
  };
  const set = (patch: Partial<FunnelDraft>) => setDraft((d) => ({ ...d!, ...patch }));
  const built = (): FunnelDraft => {
    try {
      return { ...draft!, fields: JSON.parse(fieldsText) };
    } catch {
      throw new Error('Fields is not valid JSON.');
    }
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const save = () => run(async () => {
    const f = built();
    if (!confirm(`Save "${f.key}" as a new version? It goes live at once for every tenant on this funnel.`)) return;
    open(await adminSaveFunnel(f));
    await reload();
  });
  const activate = (f: Funnel) => run(async () => {
    if (!confirm(`Make ${f.key} v${f.version} the live version?`)) return;
    await adminActivateFunnel(f.key, f.version);
    await reload();
  });
  const tryIt = () => run(async () => {
    const { reply } = await adminTryFunnel(tenantId, msg, chat, built());
    setChat((c) => [...c, ['customer', msg], ['assistant', reply]]);
    setMsg('');
  });
  const download = () => run(async () => {
    const f = built();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(f, null, 2)], { type: 'application/json' }));
    a.download = `${f.key || 'funnel'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  // The .md file: settings and behaviour rules on top, steps below (backend services/funnel_md.py). Keep it in the
  // repo (funnels/*.md) so every behaviour change has a history; loading one checks it, Save makes it live.
  const downloadMd = () => run(async () => {
    const f = built();
    const { markdown } = await adminFunnelToMd(f);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    a.download = `${f.key || 'funnel'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const load = (file: File) =>
    file.text()
      .then((t) => (file.name.toLowerCase().endsWith('.md') ? adminFunnelFromMd(t) : JSON.parse(t)))
      .then(open)
      .catch((e) => setError(`Not a funnel file: ${e.message}`));

  const keys = [...new Set(funnels.map((f) => f.key))];
  const hours = draft?.checks.find((c) => c.type === 'opening_hours');
  const ruleList = draft?.checks.filter((c) => c.type === 'rule') ?? [];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className={`${label} mr-1`}>Funnels</p>
        <button className="pill aged-paper text-black cursor-pointer" onClick={() => open(BLANK)}>New funnel</button>
        <label className="pill aged-paper text-black cursor-pointer">
          Load .md / .json
          <input type="file" accept=".md,.json,text/markdown,application/json" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ''; }} />
        </label>
      </div>

      <div className="matchbox-border bg-white divide-y divide-stone-300">
        {keys.map((key) => {
          const versions = funnels.filter((f) => f.key === key);
          return (
            <div key={key} className="p-2 flex flex-wrap items-center gap-2">
              <p className="font-bold mr-2">{key} <span className="font-normal text-stone-600">· {versions[0].name}</span></p>
              {versions.map((f) => (
                <span key={f.id} className="flex items-center gap-1">
                  <button className={`pill cursor-pointer ${f.active ? 'bg-emerald-800 text-white' : 'aged-paper text-black'}`}
                    title="Open in the editor" onClick={() => open(f)}>
                    v{f.version}{f.active && ' live'}
                  </button>
                  {!f.active && (
                    <button className="underline text-[10px] cursor-pointer disabled:opacity-40" disabled={busy} onClick={() => activate(f)}>
                      make live
                    </button>
                  )}
                </span>
              ))}
            </div>
          );
        })}
        {!keys.length && <p className="p-2 text-stone-600">No funnels yet: tenants use the built-in order steps.</p>}
      </div>

      {error && <p role="alert" className="font-bold text-[#B8251B]">{error}</p>}

      {draft && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="matchbox-border bg-white p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <label><span className={label}>Key</span><input className={input} value={draft.key} onChange={(e) => set({ key: e.target.value })} placeholder="restaurant" /></label>
              <label><span className={label}>Name</span><input className={input} value={draft.name} onChange={(e) => set({ name: e.target.value })} /></label>
              <label><span className={label}>Label</span><input className={input} value={draft.label} onChange={(e) => set({ label: e.target.value })} /></label>
            </div>
            <p className="text-[10px] text-stone-600">
              The key is also matched against a tenant&apos;s business type (&quot;restaurant&quot; → &quot;Restaurant &amp; Bar&quot;).
            </p>
            <label className="block">
              <span className={label}>Steps · write {'{label}'} and {'{summary_label}'} where the bot writes them</span>
              <textarea className={`${input} h-96 font-mono`} value={draft.steps} onChange={(e) => set({ steps: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Fields (JSON: key, label, required, max)</span>
              <textarea className={`${input} h-40 font-mono`} value={fieldsText} onChange={(e) => setFieldsText(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-3">
              {TRIGGERS.map((t) => (
                <label key={t} className="flex items-center gap-1">
                  <input type="checkbox" checked={draft.triggers.includes(t)}
                    onChange={(e) => set({ triggers: e.target.checked ? TRIGGERS.filter((x) => x === t || draft.triggers.includes(x)) : draft.triggers.filter((x) => x !== t) })} />
                  {t}
                </label>
              ))}
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={!!hours}
                  onChange={(e) => set({ checks: e.target.checked ? [...draft.checks, { type: 'opening_hours', message: HOURS_MESSAGE }] : draft.checks.filter((c) => c.type !== 'opening_hours') })} />
                no orders while closed
              </label>
            </div>
            {hours && (
              <label className="block">
                <span className={label}>Closed message · {'{opens}'} = when it opens</span>
                <input className={input} value={hours.message ?? ''}
                  onChange={(e) => set({ checks: draft.checks.map((c) => (c.type === 'opening_hours' ? { ...c, message: e.target.value } : c)) })} />
              </label>
            )}
            <div className="block">
              <span className={label}>Behaviour rules · edit them in the .md file (Download .md, edit, Load)</span>
              {ruleList.length ? (
                <ul className="list-disc pl-5 text-xs">
                  {ruleList.map((r, i) => <li key={i}>{String(r.name ?? r.when)} <span className="text-stone-500">({String(r.when)})</span></li>)}
                </ul>
              ) : (
                <p className="text-xs text-stone-600">None: nothing beyond the steps is enforced for this funnel.</p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="pill bg-black text-white cursor-pointer disabled:opacity-40" disabled={busy} onClick={save}>Save &amp; make live</button>
              <button className="pill aged-paper text-black cursor-pointer" onClick={downloadMd}>Download .md</button>
              <button className="pill aged-paper text-black cursor-pointer" onClick={download}>Download .json</button>
              <button className="pill aged-paper text-black cursor-pointer" onClick={() => setDraft(null)}>Close</button>
            </div>
          </div>

          <div className="matchbox-border bg-white p-3 space-y-2">
            <p className={label}>Try this draft (nothing is sent or saved)</p>
            <select className={input} value={tenantId} onChange={(e) => { setTenantId(e.target.value); setChat([]); }}>
              <option value="">Pick a tenant whose shop info to use…</option>
              {tenants.filter((t) => t.has_knowledge).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chat.map(([who, text], i) => (
                <p key={i} className={`whitespace-pre-wrap p-2 ${who === 'customer' ? 'bg-stone-100 ml-8' : 'border border-stone-300 mr-8'}`}>{text}</p>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (tenantId && msg.trim()) tryIt(); }}>
              <input className={input} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="2 chicken momo Baneshwor ma deliver garnu" />
              <button className="pill bg-black text-white cursor-pointer disabled:opacity-40" disabled={busy || !tenantId || !msg.trim()}>Send</button>
              <button type="button" className="pill aged-paper text-black cursor-pointer" onClick={() => setChat([])}>Reset</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
