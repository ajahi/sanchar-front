'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getKitchenPlan,
  KITCHEN_PICKUP,
  saveKitchen,
  sendToKitchen,
  syncKitchen,
  type KitchenCatalog,
  type KitchenPlan,
  type KitchenSent,
  type KitchenSettings,
} from '../api';

const field = 'rounded border border-[#E6D9BF] bg-white px-2 py-1 text-xs focus:border-[#CC3316] focus:outline-none';
const primary = 'matchbox-button-primary px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const secondary = 'matchbox-button-secondary px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const DEFAULT_URL = 'https://admin.thecubeventure.com/api/v1';
const ago = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'never');

// The business's own order system (its website checkout): connect it, re-read its menu, and the two switches.
// Sending stays off until the business has agreed how test orders are handled.
export function KitchenSettingsBar({
  canManage,
  settings,
  onChange,
}: {
  canManage: boolean;
  settings: KitchenSettings | null;
  onChange: (s: KitchenSettings) => void;
}) {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.configured) {
      setUrl(settings.base_url ?? DEFAULT_URL);
      setEmail(settings.email ?? '');
    }
  }, [settings]);

  const run = async (fn: () => Promise<KitchenSettings>) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await fn());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = (patch: Partial<{ send_enabled: boolean; auto_send: boolean }>) =>
    run(() =>
      saveKitchen({
        base_url: url,
        email: email.trim() || null,
        send_enabled: patch.send_enabled ?? settings?.send_enabled ?? false,
        auto_send: patch.auto_send ?? settings?.auto_send ?? false,
      })
    );

  if (!settings) return null;
  if (!settings.configured && !canManage) return null;

  return (
    <section className="rounded-xl border border-[#E6D9BF] bg-[#FFF8E8] p-3 space-y-2 text-xs">
      <h3 className="font-semibold text-sm">Your order system</h3>
      {settings.configured ? (
        <p>
          {new URL(settings.base_url!).hostname} · {settings.item_count} menu items · {settings.location_count} delivery areas ·
          menu read {ago(settings.synced_at)}
        </p>
      ) : (
        <p className="text-[#6B5D4F]">
          Connect your website's ordering, and confirmed chat orders can go straight to your kitchen. The menu is read from
          it and added to Shop Info, so the bot uses your exact item names and prices.
        </p>
      )}
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${field} min-w-[16rem] flex-1`} value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Order system address" />
          <input className={`${field} min-w-[12rem]`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email sent with orders" aria-label="Email sent with orders" />
          <button className={secondary} disabled={busy} onClick={() => save({})}>{settings.configured ? 'SAVE' : 'CONNECT'}</button>
          {settings.configured && <button className={secondary} disabled={busy} onClick={() => run(syncKitchen)}>READ MENU AGAIN</button>}
        </div>
      )}
      {settings.configured && (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" disabled={!canManage || busy} checked={settings.send_enabled} onChange={(e) => save({ send_enabled: e.target.checked })} />
            <span><b>Send orders to the kitchen</b>{!settings.send_enabled && ' (off: you only see what would be sent)'}</span>
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" disabled={!canManage || busy || !settings.send_enabled} checked={settings.auto_send} onChange={(e) => save({ auto_send: e.target.checked })} />
            <span><b>Automatically</b>, when the customer confirms and every item and the area matched</span>
          </label>
        </div>
      )}
      {error && <p role="alert" className="text-red-800">{error}</p>}
    </section>
  );
}

export function SentBadge({ sent }: { sent: KitchenSent }) {
  return (
    <p className="text-xs font-semibold text-emerald-800">
      ✓ In the kitchen{sent.kitchen_order_id ? ` · order #${sent.kitchen_order_id}` : ''} · Rs {sent.total} · {sent.area}
    </p>
  );
}

// One order: how its lines matched the menu, pickers for what did not, the area, the total, and SEND.
export function KitchenOrder({
  leadId,
  catalog,
  onSent,
}: {
  leadId: string;
  catalog: KitchenCatalog;
  onSent: (sent: KitchenSent) => void;
}) {
  const [plan, setPlan] = useState<KitchenPlan | null>(null);
  const [lines, setLines] = useState<{ text?: string | null; product_id: string; quantity: number }[]>([]);
  const [area, setArea] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getKitchenPlan(leadId)
      .then((p) => {
        setPlan(p);
        setLines(p.lines.map((l) => ({ text: l.text, product_id: l.product_id ?? '', quantity: l.quantity })));
        setArea(p.location ?? '');
      })
      .catch((e) => setError(e.message));
  }, [leadId]);

  const byId = useMemo(() => new Map(catalog.items.map((i) => [i.id, i])), [catalog]);
  const categories = useMemo(() => {
    const m = new Map<string, KitchenCatalog['items']>();
    for (const i of catalog.items) m.set(i.category, [...(m.get(i.category) ?? []), i]);
    return [...m.entries()];
  }, [catalog]);
  const rate = area === KITCHEN_PICKUP ? 0 : catalog.areas.find((a) => a.address === area)?.rate ?? 0;
  const total = lines.reduce((sum, l) => sum + (byId.get(l.product_id)?.price ?? 0) * l.quantity, 0) + rate;
  const ready = area !== '' && lines.length > 0 && lines.every((l) => byId.has(l.product_id) && l.quantity > 0);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const done = await sendToKitchen(leadId, lines.map(({ product_id, quantity }) => ({ product_id, quantity })), area);
      if (done.sent) onSent(done.sent);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!plan) return error ? <p role="alert" className="text-xs text-red-800">{error}</p> : <p className="text-xs">Matching to the menu…</p>;
  if (plan.sent) return <SentBadge sent={plan.sent} />;

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-[#CC3316]/40 p-2 text-xs">
      {lines.map((l, n) => (
        <div key={n} className="flex flex-wrap items-center gap-2">
          {l.text && <span className="w-full text-[#6B5D4F]">“{l.text}”{!byId.has(l.product_id) && <b className="text-[#B8251B]"> · pick the item</b>}</span>}
          <select
            className={`${field} flex-1 min-w-[12rem]`}
            value={l.product_id}
            onChange={(e) => setLines((ls) => ls.map((x, i) => (i === n ? { ...x, product_id: e.target.value } : x)))}
            aria-label="Menu item"
          >
            <option value="">Pick from the menu…</option>
            {categories.map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} · Rs {i.price}</option>)}
              </optgroup>
            ))}
          </select>
          <input
            type="number" min={1} max={99} className={`${field} w-16`} value={l.quantity} aria-label="Quantity"
            onChange={(e) => setLines((ls) => ls.map((x, i) => (i === n ? { ...x, quantity: Number(e.target.value) } : x)))}
          />
          <button className="underline cursor-pointer" onClick={() => setLines((ls) => ls.filter((_, i) => i !== n))}>remove</button>
        </div>
      ))}
      <button className="underline cursor-pointer" onClick={() => setLines((ls) => [...ls, { product_id: '', quantity: 1 }])}>+ add item</button>
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${field} min-w-[12rem]`} value={area} onChange={(e) => setArea(e.target.value)} aria-label="Delivery area">
          <option value="">Delivery area…</option>
          <option value={KITCHEN_PICKUP}>Pick up (no delivery)</option>
          {catalog.areas.map((a) => <option key={a.address} value={a.address}>{a.address} · Rs {a.rate}</option>)}
        </select>
        <span className="font-semibold">Total Rs {total}{rate ? ` (incl. delivery Rs ${rate})` : ''}</span>
      </div>
      {plan.error && <p className="text-red-800">Last automatic send failed: {plan.error}</p>}
      {error && <p role="alert" className="text-red-800">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button className={primary} disabled={busy || !ready || !plan.send_enabled} onClick={send}>SEND TO KITCHEN</button>
        {!plan.send_enabled && <span className="text-[#6B5D4F]">Sending is switched off: nothing will reach the kitchen.</span>}
      </div>
      {plan.body != null && (
        <details>
          <summary className="cursor-pointer text-[#6B5D4F]">What would be sent (as matched)</summary>
          <pre className="mt-1 max-h-48 overflow-auto rounded bg-[#1A1A1A] p-2 text-[10px] text-[#FAF3E0]">{JSON.stringify(plan.body, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

