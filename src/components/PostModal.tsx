'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Send, Upload } from 'lucide-react';
import { listShopMedia, postToInstagram, uploadShopMedia, type ShopMedia } from '../api';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';

const field = 'w-full rounded-lg border border-[#E6D9BF] bg-white px-3 py-2 text-sm focus:border-[#CC3316] focus:outline-none';
const hint = 'text-xs text-[#6B5D4F]';
const CAPTION_MAX = 2200; // Instagram's limit
const RATIO_MIN = 0.8; // width ÷ height a feed post accepts: 4:5 portrait …
const RATIO_MAX = 1.91; // … to 1.91:1 landscape
// 'tall' / 'wide' when Instagram would refuse a photo of this width ÷ height, else null.
const misfit = (r: number) => (r < RATIO_MIN ? 'tall' : r > RATIO_MAX ? 'wide' : null);
const shapeMessage = (fit: string) =>
  `This photo is too ${fit} for an Instagram post. Crop it to between 4:5 portrait and 1.91:1 landscape (square works) and upload it again.`;

// Post a photo to the shop's Instagram from Sanchar. The owner then boosts that post in the Instagram app
// (goal: More messages); chats from the ad arrive with the ad's id, which ties them back to this post.
export function PostModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [media, setMedia] = useState<ShopMedia[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState<string | null>(null); // what the preloader says while a request runs
  const [error, setError] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState<ShopMedia | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>({}); // read off each thumbnail once it loads

  const load = () => listShopMedia().then(setMedia).catch((e) => setError(e.message));
  useEffect(() => {
    if (!open) return;
    setError(null);
    setJustPosted(null);
    load();
  }, [open]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const uploads = (media ?? []).filter((m) => m.source === 'upload');
  const unposted = uploads.filter((m) => !m.ig_media_id);
  const posted = uploads.filter((m) => m.ig_media_id);
  const photo = unposted.find((m) => m.id === chosen) ?? null;
  const ratio = photo ? ratios[photo.id] : undefined;
  const badShape = ratio === undefined ? null : misfit(ratio); // photos uploaded before this check existed

  const upload = (file: File | undefined) =>
    file &&
    run('Uploading photo…', async () => {
      const bitmap = await createImageBitmap(file); // checked here so a photo Instagram would refuse is never stored
      const fit = misfit(bitmap.width / bitmap.height);
      bitmap.close();
      if (fit) throw new Error(shapeMessage(fit));
      const m = await uploadShopMedia(file, '');
      setMedia((all) => [m, ...(all ?? [])]);
      setChosen(m.id);
    });
  const publish = () =>
    photo &&
    run('Posting to Instagram…', async () => {
      const done = await postToInstagram(photo.id, caption);
      setMedia((all) => (all ?? []).map((m) => (m.id === done.id ? done : m)));
      setJustPosted(done);
      setChosen(null);
      setCaption('');
    });

  return (
    <Modal open={open} onClose={onClose} title="Post to Instagram" icon={Send} size="lg">
      <div className="relative flex min-h-0 flex-col">
        {busy && (
          // Covers the body (not the scroll content), so it stays in view and blocks double clicks.
          <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#FAF3E0]/85">
            <div className="h-10 w-10 animate-spin rounded-full" style={{ border: '4px solid #E6D9BF', borderTopColor: '#CC3316' }} />
            <p className="text-sm font-semibold">{busy}</p>
          </div>
        )}
        <div className="space-y-4 overflow-y-auto p-4 text-sm">
          {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">{error}</div>}

          {justPosted && (
            <section className="space-y-2 rounded-xl border border-[#11643D]/30 bg-[#DDF5E8] p-3 text-[#11643D]">
              <p className="font-semibold">Posted to Instagram ✓</p>
              <p className="text-xs">
                Post ID <span className="select-all font-semibold">{justPosted.ig_media_id}</span>
                {justPosted.permalink && (
                  <>
                    {' · '}
                    <a href={justPosted.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                      View on Instagram <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </p>
              <p className="text-xs font-semibold">Next: boost it</p>
              <ol className="list-decimal space-y-0.5 pl-5 text-xs">
                <li>Open the post in the Instagram app and tap <b>Boost post</b>.</li>
                <li>Choose the goal <b>More messages</b>, then audience, budget and duration.</li>
                <li>When someone messages from the ad, their chat arrives with the ad&apos;s reference code.</li>
              </ol>
            </section>
          )}

          <section className="space-y-3 rounded-2xl border border-[#E6D9BF] bg-[#FFFBF2] p-4">
            <h3 className="font-semibold">New post</h3>
            {media === null ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Photo to post">
                {unposted.map((m) => (
                  <button
                    key={m.id}
                    role="radio"
                    aria-checked={chosen === m.id}
                    className={`cursor-pointer rounded-lg ${chosen === m.id ? 'ring-2 ring-[#CC3316] ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                    onClick={() => setChosen(m.id)}
                    title={m.title || 'Photo'}
                  >
                    <img
                      src={m.url}
                      alt={m.title ?? ''}
                      className="h-20 w-20 rounded-lg object-cover"
                      onLoad={(e) => {
                        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                        setRatios((r) => ({ ...r, [m.id]: w / h }));
                      }}
                    />
                  </button>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#CC3316]/50 text-[11px] text-[#6B5D4F] hover:bg-[#F1E6CC]/60">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input type="file" accept="image/jpeg,image/png" className="sr-only" disabled={!!busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              </div>
            )}
            {badShape ? (
              <p role="alert" className="text-xs text-red-700">
                {shapeMessage(badShape)} It can still be sent in chats.
              </p>
            ) : (
              <p className={hint}>{photo ? 'This photo will be posted.' : 'Pick a photo or upload a new one (JPG or PNG; Instagram may reject other formats).'}</p>
            )}
            <div className="space-y-1">
              <textarea
                className={field}
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={CAPTION_MAX}
                placeholder={'Caption, e.g.\nNew chinnon sharara, Rs 3,350 🌸\nMaroon, navy, bottle green. DM us to order!'}
                aria-label="Caption"
              />
              <p className="text-right text-[11px] text-[#6B5D4F]">{caption.length} / {CAPTION_MAX}</p>
            </div>
            <div className="flex justify-end">
              <button className="matchbox-button-primary cursor-pointer px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={!!busy || !photo || !!badShape} onClick={publish}>
                <Send className="mr-1 inline h-4 w-4" />
                Post to Instagram
              </button>
            </div>
          </section>

          {posted.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold">Posted from Sanchar</h3>
              {posted.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[#E6D9BF] bg-[#FFFBF2] p-2">
                  <img src={m.url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{m.caption?.split('\n')[0] || 'No caption'}</p>
                    <p className="text-[11px] text-[#6B5D4F]">
                      Post ID <span className="select-all">{m.ig_media_id}</span>
                    </p>
                  </div>
                  {m.permalink && (
                    <a href={m.permalink} target="_blank" rel="noreferrer" className="matchbox-button-secondary shrink-0 px-3 py-1.5 text-xs font-semibold">
                      View <ExternalLink className="ml-0.5 inline h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
