'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import {
  addCampaignLink,
  createCampaign,
  deleteCampaign,
  listCampaignLinks,
  listCampaigns,
  listShopMedia,
  mapCampaignLink,
  updateCampaign,
  updateShopMedia,
  type Campaign,
  type CampaignLink,
  type ShopMedia,
} from '../api';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';

const field = 'w-full p-1 border border-black bg-[#FAF3E0]/30 font-mono text-[11px]';
const btn = 'pill bg-[#1A1A1A] text-white hover:bg-black cursor-pointer text-[9px] disabled:opacity-50';

// One campaign per ad: its own price, a one-line description and its photos. When a customer who came from a
// mapped ad asks "pp" / "price kati ho" / "other colour?", the bot sends this price line and the photos.
export function CampaignsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [media, setMedia] = useState<ShopMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { name: string; price: string; blurb: string }>>({});
  const [form, setForm] = useState({ name: '', price: '', blurb: '' });
  const [manual, setManual] = useState<{ kind: 'ad' | 'ref'; id: string; campaign: string }>({ kind: 'ref', id: '', campaign: '' });

  const load = () =>
    Promise.all([listCampaigns(), listCampaignLinks(), listShopMedia()])
      .then(([c, l, m]) => {
        setCampaigns(c);
        setLinks(l);
        setMedia(m);
        setDrafts(Object.fromEntries(c.map((x) => [x.id, { name: x.name, price: x.price?.toString() ?? '', blurb: x.blurb ?? '' }])));
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (!open) return;
    setError(null);
    load();
  }, [open]);

  // Runs one change, then reloads so the lists always show what the server has.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const price = (s: string) => (s.trim() === '' ? null : Number(s));
  const priceOk = (s: string) => s.trim() === '' || (Number.isInteger(Number(s)) && Number(s) >= 0);
  const unmapped = links.filter((l) => !l.campaign_id);

  return (
    <Modal open={open} onClose={onClose} title="Campaigns: price and photos per ad" icon={Megaphone} size="xl">
      <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs">
        {error && <div className="p-2 bg-red-100 border border-red-700 text-red-900 text-[10px]">{error}</div>}
        {campaigns === null && !error && (
          <div role="status" aria-label="Loading campaigns" className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {/* Campaigns */}
        <section className="matchbox-border p-3 bg-white space-y-3">
          <h3 className="serif-heading text-xs font-bold text-[#1A2B4C] border-b border-black pb-1">1. Campaigns</h3>
          {campaigns?.length === 0 && <p className="opacity-70">No campaign yet. Add one below, then map your ads to it.</p>}
          {campaigns?.map((c) => {
            const d = drafts[c.id] ?? { name: c.name, price: '', blurb: '' };
            const set = (patch: Partial<typeof d>) => setDrafts({ ...drafts, [c.id]: { ...d, ...patch } });
            const dirty = d.name !== c.name || d.price !== (c.price?.toString() ?? '') || d.blurb !== (c.blurb ?? '');
            return (
              <div key={c.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-b border-black/20 pb-2">
                <label className="sm:col-span-3">
                  <span className="opacity-70 text-[9px] block">NAME</span>
                  <input className={field} value={d.name} onChange={(e) => set({ name: e.target.value })} />
                </label>
                <label className="sm:col-span-2">
                  <span className="opacity-70 text-[9px] block">PRICE (RS)</span>
                  <input className={field} inputMode="numeric" value={d.price} onChange={(e) => set({ price: e.target.value })} />
                </label>
                <label className="sm:col-span-4">
                  <span className="opacity-70 text-[9px] block">ONE-LINE DESCRIPTION</span>
                  <input className={field} value={d.blurb} onChange={(e) => set({ blurb: e.target.value })} placeholder="pure chinnon silk fabric, comes with quality guarantee" />
                </label>
                <div className="sm:col-span-3 flex flex-wrap gap-1 justify-end">
                  <button
                    className={btn}
                    disabled={busy || !dirty || !d.name.trim() || !priceOk(d.price)}
                    onClick={() => run(() => updateCampaign(c.id, { name: d.name.trim(), price: price(d.price), blurb: d.blurb.trim() || null }))}
                  >
                    SAVE
                  </button>
                  <button
                    className={btn}
                    disabled={busy}
                    onClick={() => run(() => updateCampaign(c.id, { status: c.status === 'active' ? 'paused' : 'active' }))}
                    title="A paused campaign stops the automatic price and photo reply"
                  >
                    {c.status === 'active' ? 'PAUSE' : 'ACTIVATE'}
                  </button>
                  <button
                    className="pill bg-[#B8251B] text-white hover:opacity-90 cursor-pointer text-[9px] disabled:opacity-50"
                    disabled={busy}
                    onClick={() => confirm(`Delete "${c.name}"? Its ads become unmapped and its photos stay in the media panel.`) && run(() => deleteCampaign(c.id))}
                  >
                    DELETE
                  </button>
                </div>
                <p className="sm:col-span-12 text-[10px] opacity-70">
                  {c.status === 'active' ? '● live' : '○ paused'} · {c.photo_count} photo{c.photo_count === 1 ? '' : 's'}
                  {c.status === 'active' && !c.price && !c.blurb?.trim() ? ' · add a price or description or the bot has nothing to send' : ''}
                </p>
              </div>
            );
          })}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
            <label className="sm:col-span-3">
              <span className="opacity-70 text-[9px] block">NEW CAMPAIGN</span>
              <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chinnon sharara" />
            </label>
            <label className="sm:col-span-2">
              <span className="opacity-70 text-[9px] block">PRICE (RS)</span>
              <input className={field} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label className="sm:col-span-5">
              <span className="opacity-70 text-[9px] block">ONE-LINE DESCRIPTION</span>
              <input className={field} value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button
                className={btn}
                disabled={busy || !form.name.trim() || !priceOk(form.price)}
                onClick={() =>
                  run(async () => {
                    await createCampaign({ name: form.name.trim(), price: price(form.price), blurb: form.blurb.trim() || null });
                    setForm({ name: '', price: '', blurb: '' });
                  })
                }
              >
                ADD
              </button>
            </div>
          </div>
        </section>

        {/* Ads and ref codes */}
        <section className="matchbox-border p-3 bg-white space-y-3">
          <h3 className="serif-heading text-xs font-bold text-[#1A2B4C] border-b border-black pb-1">
            2. Ads and links {unmapped.length > 0 && <span className="text-[#B8251B]">({unmapped.length} need a campaign)</span>}
          </h3>
          <p className="text-[10px] opacity-70">
            A chat that opens from an ad shows up here by itself. Pick its campaign once and every chat from that ad gets the
            campaign's price and photos. For reels or bio links, add the code from your <code>ig.me/yourname?ref=CODE</code> link.
          </p>
          {links.length === 0 && <p className="opacity-70">No ads seen yet.</p>}
          {links.map((l) => (
            <div key={l.id} className={`flex items-center gap-2 p-1 ${l.campaign_id ? '' : 'bg-amber-100 border border-amber-600'}`}>
              {l.ad_image_url ? <img src={l.ad_image_url} alt="" className="w-10 h-10 object-cover border border-black shrink-0" /> : <div className="w-10 h-10 border border-black/30 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{l.ad_title || l.external_id}</p>
                <p className="text-[9px] opacity-60">{l.kind === 'ad' ? 'Ad' : 'Ref code'} · {l.external_id}</p>
              </div>
              <select
                className="p-1 border border-black bg-[#FAF3E0] text-[11px] max-w-[45%]"
                value={l.campaign_id ?? ''}
                disabled={busy}
                onChange={(e) => run(() => mapCampaignLink(l.id, e.target.value || null))}
              >
                <option value="">Not mapped</option>
                {campaigns?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2 pt-1">
            <label>
              <span className="opacity-70 text-[9px] block">ADD BY HAND</span>
              <select className="p-1 border border-black bg-[#FAF3E0] text-[11px]" value={manual.kind} onChange={(e) => setManual({ ...manual, kind: e.target.value as 'ad' | 'ref' })}>
                <option value="ref">Ref code</option>
                <option value="ad">Ad id</option>
              </select>
            </label>
            <input className={`${field} flex-1 min-w-[8rem]`} value={manual.id} onChange={(e) => setManual({ ...manual, id: e.target.value })} placeholder="e.g. SHARARA-01" />
            <select className="p-1 border border-black bg-[#FAF3E0] text-[11px]" value={manual.campaign} onChange={(e) => setManual({ ...manual, campaign: e.target.value })}>
              <option value="">Not mapped</option>
              {campaigns?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              className={btn}
              disabled={busy || !manual.id.trim()}
              onClick={() => run(async () => { await addCampaignLink(manual.kind, manual.id.trim(), manual.campaign || null); setManual({ ...manual, id: '' }); })}
            >
              ADD
            </button>
          </div>
        </section>

        {/* Photos */}
        <section className="matchbox-border p-3 bg-white space-y-2">
          <h3 className="serif-heading text-xs font-bold text-[#1A2B4C] border-b border-black pb-1">3. Photos sent with a campaign</h3>
          <p className="text-[10px] opacity-70">
            Up to 5 in-stock photos go out after the price, lowest order first. Add or retitle photos in the Shop Photos panel,
            then choose which campaign each belongs to here.
          </p>
          {media.length === 0 && <p className="opacity-70">No photos yet. Upload them in the Shop Photos panel.</p>}
          {media.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <img src={m.url} alt="" className="w-10 h-10 object-cover border border-black shrink-0" />
              <p className="min-w-0 flex-1 truncate">
                {m.title || m.caption?.slice(0, 40) || 'Untitled'}
                {!m.in_stock && <span className="ml-1 text-[#B8251B]">· sold out (not sent)</span>}
              </p>
              <select
                className="p-1 border border-black bg-[#FAF3E0] text-[11px] max-w-[40%]"
                value={m.campaign_id ?? ''}
                disabled={busy}
                onChange={(e) => run(() => updateShopMedia(m.id, { campaign_id: e.target.value || null }))}
              >
                <option value="">No campaign</option>
                {campaigns?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                className="w-12 p-1 border border-black bg-[#FAF3E0]/30 text-[11px] text-center"
                inputMode="numeric"
                title="Order: lowest is sent first"
                defaultValue={m.sort_order}
                disabled={busy || !m.campaign_id}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 0 && n !== m.sort_order) run(() => updateShopMedia(m.id, { sort_order: n }));
                }}
              />
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}
