'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Megaphone, Send, Upload, X } from 'lucide-react';
import {
  addCampaignLink,
  createCampaign,
  deleteCampaign,
  listCampaignLinks,
  listCampaigns,
  listShopMedia,
  mapCampaignLink,
  publishCampaign,
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
const DETAILS_HINT = 'Everything else a customer may ask about this product, one fact per line, e.g.\nColours: maroon, navy, bottle green\nSizes: S to XXL\nFabric: pure chinnon silk\nDelivery: 2-4 days outside the valley';

type Run = (fn: () => Promise<unknown>) => Promise<void>;

const price = (s: string) => (s.trim() === '' ? null : Number(s));
const priceOk = (s: string) => s.trim() === '' || (Number.isInteger(Number(s)) && Number(s) >= 0);
// Mirrors campaign_text() on the backend, so the card shows exactly what the bot will send.
const replyText = (p: number | null, blurb: string) => [p ? `Rs ${p} price` : null, blurb.trim() || null].filter(Boolean).join(', ');

// One campaign per product you promote: what the bot answers about it, its photos, its Instagram post,
// and the ads made by boosting that post. Customers who message from those ads get this campaign's answers.
export function CampaignsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [media, setMedia] = useState<ShopMedia[]>([]);
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

  const unmapped = links.filter((l) => !l.campaign_id && l.kind === 'ad');

  return (
    <Modal open={open} onClose={onClose} title="Campaigns" icon={Megaphone} size="xl">
      <div className="p-4 overflow-y-auto space-y-4 text-sm">
        {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</div>}

        <ol className="grid gap-2 sm:grid-cols-4">
          {[
            'Write what the bot answers: price, a reply line and the product details.',
            'Add the product photos.',
            'Post it to your Instagram from here.',
            'Boost that post in the Instagram app. Chats from the ad get these answers.',
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
            <p className={hint}>Customers messaged you from these ads. Pick the campaign once and every chat from the ad gets its answers.</p>
            {unmapped.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <Thumb src={l.ad_image_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.ad_title || 'Ad'}</p>
                  <p className="text-[11px] text-[#6B5D4F]">Ad ID · {l.external_id}</p>
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
            <input className={`${field} sm:col-span-6`} value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} placeholder="Reply line, e.g. pure chinnon silk, quality guarantee" aria-label="Reply line sent with the price" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className={hint}>Next you add the details, photos, and post it.</p>
            <button
              className={primary}
              disabled={busy || !form.name.trim() || !priceOk(form.price)}
              onClick={() =>
                run(async () => {
                  await createCampaign({ name: form.name.trim(), price: price(form.price), blurb: form.blurb.trim() || null });
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
            ads={links.filter((l) => l.campaign_id === c.id && l.kind === 'ad')}
            photos={media.filter((m) => m.campaign_id === c.id).sort((a, b) => a.sort_order - b.sort_order)}
            spare={media.filter((m) => !m.campaign_id)}
            busy={busy}
            run={run}
          />
        ))}
      </div>
    </Modal>
  );
}

function CampaignCard({ c, ads, photos, spare, busy, run }: {
  c: Campaign;
  ads: CampaignLink[];
  photos: ShopMedia[];
  spare: ShopMedia[];
  busy: boolean;
  run: Run;
}) {
  const saved = { name: c.name, price: c.price?.toString() ?? '', blurb: c.blurb ?? '', details: c.details ?? '' };
  const [d, setD] = useState(saved);
  const [picking, setPicking] = useState(false);
  const [adId, setAdId] = useState('');
  const postable = photos.filter((p) => p.source === 'upload');
  const [postPhoto, setPostPhoto] = useState('');
  const [caption, setCaption] = useState('');
  useEffect(() => setD(saved), [c.name, c.price, c.blurb, c.details]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = d.name !== saved.name || d.price !== saved.price || d.blurb !== saved.blurb || d.details !== saved.details;
  const text = replyText(c.price, c.blurb ?? '');
  const defaultCaption = [c.name, c.blurb, c.price ? `Rs ${c.price}` : null, 'DM us to order!'].filter(Boolean).join('\n');
  const todo = [!text && 'a price or reply line', !c.ig_post_id && ads.length === 0 && 'a post'].filter(Boolean) as string[];
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

  return (
    <article className="space-y-4 rounded-2xl border border-[#E6D9BF] bg-[#FFFBF2] p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{c.name}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </header>

      <Step n={1} title="What the bot answers">
        <div className="grid gap-2 sm:grid-cols-12">
          <input className={`${field} sm:col-span-4`} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} aria-label="Campaign name" />
          <input className={`${field} sm:col-span-2`} inputMode="numeric" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} placeholder="Price (Rs)" aria-label="Price in rupees" />
          <input className={`${field} sm:col-span-6`} value={d.blurb} onChange={(e) => setD({ ...d, blurb: e.target.value })} placeholder="Reply line sent with the price" aria-label="Reply line sent with the price" />
        </div>
        <p className={hint}>
          {replyText(price(d.price), d.blurb) ? <>When asked “price?”, the bot replies: <q className="text-[#2A211B]">{replyText(price(d.price), d.blurb)}</q> and sends the photos.</> : 'Add a price or a reply line, or the bot has nothing to send for “price?”.'}
        </p>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-[#6B5D4F]">Product details: the AI answers every other question about it from these</span>
          <textarea
            className={field}
            rows={Math.min(8, Math.max(4, d.details.split('\n').length + 1))}
            value={d.details}
            onChange={(e) => setD({ ...d, details: e.target.value })}
            placeholder={DETAILS_HINT}
          />
        </label>
        {dirty && (
          <div className="flex justify-end">
            <button
              className={primary}
              disabled={busy || !d.name.trim() || !priceOk(d.price)}
              onClick={() => run(() => updateCampaign(c.id, { name: d.name.trim(), price: price(d.price), blurb: d.blurb.trim() || null, details: d.details.trim() || null }))}
            >
              Save
            </button>
          </div>
        )}
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
          <label className={`${secondary} inline-flex items-center`}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            Upload photos
            <input type="file" accept="image/jpeg,image/png" multiple className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          </label>
          <button className={secondary} disabled={busy || spare.length === 0} onClick={() => setPicking(!picking)}>
            <ImagePlus className="mr-1 inline h-3.5 w-3.5" />
            {spare.length ? 'Pick from Shop Photos' : 'No unused Shop Photos'}
          </button>
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

      <Step n={3} title="Post it on Instagram">
        {c.ig_post_id ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#DDF5E8] p-3 text-[#11643D]">
            <span className="font-semibold">Posted ✓</span>
            {c.ig_permalink && (
              <a href={c.ig_permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                View post <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <span className="text-[11px]">Post ID · {c.ig_post_id}</span>
          </div>
        ) : postable.length === 0 ? (
          <p className={hint}>Upload a photo in step 2 first. Instagram needs a photo uploaded here (JPEG works best).</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Photo to post">
              {postable.map((p) => {
                const chosen = (postPhoto || postable[0].id) === p.id;
                return (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={chosen}
                    className={`cursor-pointer rounded-lg ${chosen ? 'ring-2 ring-[#CC3316] ring-offset-2' : 'opacity-60 hover:opacity-100'}`}
                    onClick={() => setPostPhoto(p.id)}
                  >
                    <img src={p.url} alt={p.title ?? ''} className="h-16 w-16 rounded-lg object-cover" />
                  </button>
                );
              })}
            </div>
            <textarea
              className={field}
              rows={4}
              value={caption || defaultCaption}
              onChange={(e) => setCaption(e.target.value)}
              aria-label="Caption"
              maxLength={2200}
            />
            <div className="flex items-center justify-between gap-2">
              <p className={hint}>Posts this photo and caption to your connected Instagram account.</p>
              <button
                className={primary}
                disabled={busy}
                onClick={() => run(() => publishCampaign(c.id, postPhoto || postable[0].id, caption || defaultCaption))}
              >
                <Send className="mr-1 inline h-3.5 w-3.5" />
                Publish to Instagram
              </button>
            </div>
          </>
        )}
      </Step>

      <Step n={4} title="Boost it and link the ad">
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#6B5D4F]">
          <li>Open the post in the Instagram app and tap <b>Boost post</b>.</li>
          <li>Choose the goal <b>More messages</b>, then your audience, budget and duration.</li>
          <li>When the first customer messages from the ad, it appears at the top of this screen. Pick this campaign there.</li>
        </ol>
        {ads.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <Thumb src={l.ad_image_url} />
            <p className="min-w-0 flex-1 truncate">
              <span className="font-semibold">{l.ad_title || 'Ad'}</span> <span className="text-[11px] text-[#6B5D4F]">· Ad ID {l.external_id}</span>
            </p>
            <button className={secondary} disabled={busy} onClick={() => run(() => mapCampaignLink(l.id, null))}>Unlink</button>
          </div>
        ))}
        <details className="text-xs">
          <summary className="cursor-pointer text-[#6B5D4F]">Link the ad before the first chat</summary>
          <div className="mt-2 flex gap-2">
            <input className={field} value={adId} onChange={(e) => setAdId(e.target.value)} placeholder="Ad ID from Ads Manager" aria-label="Ad ID" />
            <button
              className={secondary}
              disabled={busy || !adId.trim()}
              onClick={() => run(async () => { await addCampaignLink('ad', adId.trim(), c.id); setAdId(''); })}
            >
              Link ad
            </button>
          </div>
        </details>
      </Step>

      <footer className="flex flex-wrap justify-end gap-2 border-t border-[#E6D9BF] pt-3">
        <button
          className={secondary}
          disabled={busy}
          onClick={() => run(() => updateCampaign(c.id, { status: c.status === 'active' ? 'paused' : 'active' }))}
          title="A paused campaign stops the automatic answers"
        >
          {c.status === 'active' ? 'Pause' : 'Resume'}
        </button>
        <button
          className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-[#B8251B] hover:underline disabled:opacity-50"
          disabled={busy}
          onClick={() => confirm(`Delete "${c.name}"? Its ads become unmapped and its photos stay in Shop Photos. The Instagram post stays on Instagram.`) && run(() => deleteCampaign(c.id))}
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
