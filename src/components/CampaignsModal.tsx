'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, ImagePlus, Megaphone, Upload, X } from 'lucide-react';
import {
  addCampaignLink,
  createCampaign,
  deleteCampaign,
  getInstagramProfiles,
  listCampaignLinks,
  listCampaigns,
  listShopMedia,
  mapCampaignLink,
  updateCampaign,
  updateShopMedia,
  uploadShopMedia,
  type Campaign,
  type CampaignLink,
  type ShopMedia,
} from '../api';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';

const field = 'w-full rounded-lg border border-[#E6D9BF] bg-white px-3 py-2 text-sm focus:border-[#CC3316] focus:outline-none';
const hint = 'text-xs text-[#6B5D4F]';
const primary = 'matchbox-button-primary px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const secondary = 'matchbox-button-secondary px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const MAX_PHOTOS = 5; // the bot sends at most this many in-stock photos (backend services/campaigns.py)

type Run = (fn: () => Promise<unknown>) => Promise<void>;

const price = (s: string) => (s.trim() === '' ? null : Number(s));
const priceOk = (s: string) => s.trim() === '' || (Number.isInteger(Number(s)) && Number(s) >= 0);
// Mirrors campaign_text() on the backend, so the card shows exactly what the bot will send.
const replyText = (p: number | null, blurb: string) => [p ? `Rs ${p} price` : null, blurb.trim() || null].filter(Boolean).join(', ');
// "Chinnon sharara" -> "CHINNON-SHARARA-K3F9": readable, and the suffix keeps it unique per shop.
const refCode = (name: string) =>
  `${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'CAMPAIGN'}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// One campaign per product you promote. Customers who reach you through its link or ad and ask
// "pp" / "price kati ho" / "photo?" get its price line and photos from the bot, no AI involved.
export function CampaignsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [media, setMedia] = useState<ShopMedia[]>([]);
  const [igUser, setIgUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', blurb: '' });

  const load = () =>
    Promise.all([listCampaigns(), listCampaignLinks(), listShopMedia()])
      .then(([c, l, m]) => {
        setCampaigns(c);
        setLinks(l);
        setMedia(m);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (!open) return;
    setError(null);
    load();
    getInstagramProfiles()
      .then((p) => setIgUser(p.find((x) => x.username)?.username ?? null))
      .catch(() => setIgUser(null));
  }, [open]);

  // Runs one change, then reloads so everything shows what the server has.
  const run: Run = async (fn) => {
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

  const unmapped = links.filter((l) => !l.campaign_id);

  return (
    <Modal open={open} onClose={onClose} title="Campaigns" icon={Megaphone} size="xl">
      <div className="p-4 overflow-y-auto space-y-4 text-sm">
        {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</div>}

        <ol className="grid gap-2 sm:grid-cols-3">
          {[
            'Set the price, a one-line description and photos.',
            'Share the campaign link, or run an ad on Instagram, Facebook or WhatsApp.',
            'When a customer from it asks “price?” or “photo?”, the bot replies with these automatically.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2 rounded-xl bg-[#F1E6CC]/60 p-3 text-xs">
              <StepDot n={i + 1} />
              <span>{t}</span>
            </li>
          ))}
        </ol>

        {unmapped.length > 0 && (
          <section className="space-y-2 rounded-xl border border-[#FFB627] bg-[#FFF4D6] p-3">
            <h3 className="font-semibold">
              {unmapped.length === 1 ? 'A new ad needs a campaign' : `${unmapped.length} new ads need a campaign`}
            </h3>
            <p className={hint}>Customers messaged you from these. Pick a campaign once and every chat from it gets that price and photos.</p>
            {unmapped.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <Thumb src={l.ad_image_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.ad_title || l.external_id}</p>
                  <p className="text-[11px] text-[#6B5D4F]">{l.kind === 'ad' ? 'Ad' : 'Link code'} · {l.external_id}</p>
                </div>
                <select
                  className={`${field} max-w-[45%]`}
                  value=""
                  disabled={busy || !campaigns?.length}
                  onChange={(e) => e.target.value && run(() => mapCampaignLink(l.id, e.target.value))}
                >
                  <option value="">{campaigns?.length ? 'Choose campaign…' : 'Create a campaign first'}</option>
                  {campaigns?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-2 rounded-2xl border border-dashed border-[#CC3316]/40 p-4">
          <h3 className="font-semibold">New campaign</h3>
          <div className="grid gap-2 sm:grid-cols-12">
            <input className={`${field} sm:col-span-4`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product, e.g. Chinnon sharara" aria-label="Campaign name" />
            <input className={`${field} sm:col-span-2`} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price (Rs)" aria-label="Price in rupees" />
            <input className={`${field} sm:col-span-6`} value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} placeholder="One line, e.g. pure chinnon silk, quality guarantee" aria-label="One-line description" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={hint}>You&apos;ll add photos and get the shareable link next.</p>
            <button
              className={primary}
              disabled={busy || !form.name.trim() || !priceOk(form.price)}
              onClick={() =>
                run(async () => {
                  const c = await createCampaign({ name: form.name.trim(), price: price(form.price), blurb: form.blurb.trim() || null });
                  await addCampaignLink('ref', refCode(c.name), c.id); // every campaign starts with a shareable link
                  setForm({ name: '', price: '', blurb: '' });
                })
              }
            >
              Create campaign
            </button>
          </div>
        </section>

        {campaigns === null && !error && (
          <div role="status" aria-label="Loading campaigns" className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {campaigns?.map((c) => (
          <CampaignCard
            key={c.id}
            c={c}
            links={links.filter((l) => l.campaign_id === c.id)}
            photos={media.filter((m) => m.campaign_id === c.id).sort((a, b) => a.sort_order - b.sort_order)}
            spare={media.filter((m) => !m.campaign_id)}
            igUser={igUser}
            busy={busy}
            run={run}
          />
        ))}
      </div>
    </Modal>
  );
}

function CampaignCard({ c, links, photos, spare, igUser, busy, run }: {
  c: Campaign;
  links: CampaignLink[];
  photos: ShopMedia[];
  spare: ShopMedia[];
  igUser: string | null;
  busy: boolean;
  run: Run;
}) {
  const saved = { name: c.name, price: c.price?.toString() ?? '', blurb: c.blurb ?? '' };
  const [d, setD] = useState(saved);
  const [picking, setPicking] = useState(false);
  const [adId, setAdId] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => setD(saved), [c.name, c.price, c.blurb]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = d.name !== saved.name || d.price !== saved.price || d.blurb !== saved.blurb;
  const refs = links.filter((l) => l.kind === 'ref');
  const ads = links.filter((l) => l.kind === 'ad');
  const text = replyText(c.price, c.blurb ?? '');
  const todo = [!text && 'a price or description', links.length === 0 && 'a link or ad'].filter(Boolean) as string[];
  const status =
    c.status === 'paused'
      ? { label: '○ Paused', cls: 'bg-[#EFE6D4] text-[#6B5D4F]' }
      : todo.length
        ? { label: `Needs ${todo.join(' and ')}`, cls: 'bg-[#FFF4D6] text-[#7A4F00]' }
        : { label: '● Live', cls: 'bg-[#DDF5E8] text-[#11643D]' };

  // Rewrite sort_order as 0..n so moves stay simple even if old orders collide.
  const move = (i: number, dir: -1 | 1) => {
    const next = [...photos];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    run(() => Promise.all(next.map((p, k) => (p.sort_order === k ? null : updateShopMedia(p.id, { sort_order: k })))));
  };
  const upload = (files: FileList | null) =>
    files?.length &&
    run(async () => {
      let n = photos.length;
      for (const f of Array.from(files)) {
        const m = await uploadShopMedia(f, c.name);
        await updateShopMedia(m.id, { campaign_id: c.id, sort_order: n++ });
      }
    });
  const copy = (s: string) =>
    navigator.clipboard.writeText(s).then(() => {
      setCopied(s);
      setTimeout(() => setCopied(null), 1500);
    });

  return (
    <article className="space-y-4 rounded-2xl border border-[#E6D9BF] bg-[#FFFBF2] p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{c.name}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </header>

      <Step n={1} title="What the bot sends">
        <div className="grid gap-2 sm:grid-cols-12">
          <input className={`${field} sm:col-span-4`} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} aria-label="Campaign name" />
          <input className={`${field} sm:col-span-2`} inputMode="numeric" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} placeholder="Price (Rs)" aria-label="Price in rupees" />
          <input className={`${field} sm:col-span-6`} value={d.blurb} onChange={(e) => setD({ ...d, blurb: e.target.value })} placeholder="One-line description" aria-label="One-line description" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={hint}>
            {replyText(price(d.price), d.blurb) ? <>Bot replies: <q className="text-[#2A211B]">{replyText(price(d.price), d.blurb)}</q></> : 'Add a price or description, or the bot has nothing to send.'}
          </p>
          {dirty && (
            <button
              className={primary}
              disabled={busy || !d.name.trim() || !priceOk(d.price)}
              onClick={() => run(() => updateCampaign(c.id, { name: d.name.trim(), price: price(d.price), blurb: d.blurb.trim() || null }))}
            >
              Save
            </button>
          )}
        </div>
      </Step>

      <Step n={2} title={`Photos (${photos.length})`}>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <figure key={p.id} className="w-20 space-y-1">
                <div className="relative">
                  <img src={p.url} alt={p.title ?? ''} className={`h-20 w-20 rounded-lg object-cover ${p.in_stock ? '' : 'opacity-40'}`} />
                  <button
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[#2A211B] text-white"
                    disabled={busy}
                    onClick={() => run(() => updateShopMedia(p.id, { campaign_id: null }))}
                    aria-label="Remove from campaign"
                    title="Remove from campaign (stays in Shop Photos)"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <figcaption className="flex items-center justify-between text-[11px] text-[#6B5D4F]">
                  <button className="cursor-pointer disabled:opacity-30" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Send earlier"><ArrowLeft className="h-3.5 w-3.5" /></button>
                  {p.in_stock ? `#${i + 1}` : 'sold out'}
                  <button className="cursor-pointer disabled:opacity-30" disabled={busy || i === photos.length - 1} onClick={() => move(i, 1)} aria-label="Send later"><ArrowRight className="h-3.5 w-3.5" /></button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <p className={hint}>The first {MAX_PHOTOS} in-stock photos are sent after the price, in this order. Sold-out photos are skipped.</p>
        <div className="flex flex-wrap gap-2">
          <button className={secondary} disabled={busy || spare.length === 0} onClick={() => setPicking(!picking)}>
            <ImagePlus className="mr-1 inline h-3.5 w-3.5" />
            {spare.length ? 'Pick from Shop Photos' : 'No unused Shop Photos'}
          </button>
          <label className={`${secondary} inline-flex items-center`}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            Upload photos
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          </label>
        </div>
        {picking && (
          <div className="flex flex-wrap gap-2 rounded-xl bg-[#F1E6CC]/60 p-2">
            {spare.map((m) => (
              <button
                key={m.id}
                className="cursor-pointer rounded-lg ring-[#CC3316] hover:ring-2 disabled:opacity-50"
                disabled={busy}
                onClick={() => run(() => updateShopMedia(m.id, { campaign_id: c.id, sort_order: photos.length }))}
                title={`Add ${m.title || 'photo'}`}
              >
                <img src={m.url} alt={m.title ?? ''} className="h-16 w-16 rounded-lg object-cover" />
              </button>
            ))}
          </div>
        )}
      </Step>

      <Step n={3} title="How customers reach it">
        {refs.map((l) => {
          const url = igUser ? `https://ig.me/${igUser}?ref=${encodeURIComponent(l.external_id)}` : l.external_id;
          return (
            <div key={l.id} className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-[#E6D9BF] bg-white px-3 py-2 text-xs">{url}</code>
              <button className={secondary} onClick={() => copy(url)}>
                {copied === url ? <Check className="mr-1 inline h-3.5 w-3.5" /> : <Copy className="mr-1 inline h-3.5 w-3.5" />}
                {copied === url ? 'Copied' : 'Copy'}
              </button>
            </div>
          );
        })}
        {refs.length > 0 ? (
          <p className={hint}>
            {igUser
              ? 'Put this link in your bio, a story or a reel. Chats that open from it get this campaign. It works right away, no ad needed.'
              : 'Connect Instagram to get a ready-made link. Until then, this is the code to add as ?ref= to your ig.me link.'}
          </p>
        ) : (
          <button className={secondary} disabled={busy} onClick={() => run(() => addCampaignLink('ref', refCode(c.name), c.id))}>
            Create a shareable link
          </button>
        )}

        {ads.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <Thumb src={l.ad_image_url} />
            <p className="min-w-0 flex-1 truncate">
              <span className="font-semibold">{l.ad_title || 'Ad'}</span> <span className="text-[11px] text-[#6B5D4F]">· {l.external_id}</span>
            </p>
            <button className={secondary} disabled={busy} onClick={() => run(() => mapCampaignLink(l.id, null))}>Unlink</button>
          </div>
        ))}
        <details className="text-xs">
          <summary className="cursor-pointer text-[#6B5D4F]">Running a paid ad?</summary>
          <div className="mt-2 space-y-2">
            <p className={hint}>
              You don&apos;t need to do anything first: the ad appears at the top of this screen after the first customer messages from it, and you pick this
              campaign there. To link it before that, paste its ad ID from Ads Manager.
            </p>
            <div className="flex gap-2">
              <input className={field} value={adId} onChange={(e) => setAdId(e.target.value)} placeholder="Ad ID, e.g. 120210000000000000" aria-label="Ad ID" />
              <button
                className={secondary}
                disabled={busy || !adId.trim()}
                onClick={() => run(async () => { await addCampaignLink('ad', adId.trim(), c.id); setAdId(''); })}
              >
                Link ad
              </button>
            </div>
          </div>
        </details>
      </Step>

      <footer className="flex flex-wrap justify-end gap-2 border-t border-[#E6D9BF] pt-3">
        <button
          className={secondary}
          disabled={busy}
          onClick={() => run(() => updateCampaign(c.id, { status: c.status === 'active' ? 'paused' : 'active' }))}
          title="A paused campaign stops the automatic price and photo reply"
        >
          {c.status === 'active' ? 'Pause' : 'Resume'}
        </button>
        <button
          className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-[#B8251B] hover:underline disabled:opacity-50"
          disabled={busy}
          onClick={() => confirm(`Delete "${c.name}"? Its links and ads become unmapped and its photos stay in Shop Photos.`) && run(() => deleteCampaign(c.id))}
        >
          Delete
        </button>
      </footer>
    </article>
  );
}

function StepDot({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2A211B] text-[11px] font-semibold text-[#FFFBF2]">{n}</span>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <StepDot n={n} />
        {title}
      </h4>
      {children}
    </section>
  );
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded-lg border border-[#E6D9BF]" />
  );
}
