'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Sparkles, Tags, X } from 'lucide-react';
import { Modal } from './Modal';
import { ShopMedia, suggestShopMediaTags, updateShopMedia, uploadShopMedia } from '../api';

interface Draft {
  title: string;
  tags: string[];
  ai: string[]; // what the model suggested (marked with a sparkle)
  status: 'suggesting' | 'ready' | 'failed' | 'saved';
}

interface Props {
  start: ShopMedia[]; // photos to (re)tag; empty = pick files to upload first
  vocabulary: string[]; // tags the shop already uses, offered as one-click chips
  onSaved: (m: ShopMedia, isNew: boolean) => void;
  onClose: () => void;
}

const MAX_TAGS = 8; // same cap as the backend (schemas/shop_media.py)
const MAX_SIDE = 1600;

// Phone photos are often over the 5 MB upload limit: scale down to MAX_SIDE and re-encode as JPEG.
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // transparent PNG areas would turn black in a JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file; // the browser can't read it (e.g. HEIC): let the server say why
  }
}

const cleanTag = (t: string) => t.toLowerCase().replace(/\s+/g, ' ').trim().replace(/^#+/, '').trim().slice(0, 30);

// Upload many photos at once, then step through them: photo on the left, name + tags on the right.
// The AI's tags come pre-selected; the admin removes the wrong ones, adds missing ones and confirms.
export function PhotoTaggerModal({ start, vocabulary, onSaved, onClose }: Props) {
  const [photos, setPhotos] = useState<ShopMedia[]>(start);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(start.map((m) => [m.id, { title: m.title ?? '', tags: m.tags, ai: [], status: 'ready' }]))
  );
  const [index, setIndex] = useState(0);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; // StrictMode mounts twice: the first cleanup must not leave this false
    return () => {
      alive.current = false;
    };
  }, []);

  const patch = (id: string, change: Partial<Draft>) =>
    setDrafts((d) => (d[id] ? { ...d, [id]: { ...d[id], ...change } } : d));
  // An edit to a confirmed photo makes it unsaved again, so it can be confirmed once more.
  const edit = (id: string, change: Partial<Draft>) =>
    setDrafts((d) =>
      d[id] ? { ...d, [id]: { ...d[id], ...change, status: d[id].status === 'saved' ? 'ready' : d[id].status } } : d
    );

  // Suggestions are fetched one by one, so the first photo is ready to tag while the rest are still queued.
  const suggest = async (m: ShopMedia) => {
    patch(m.id, { status: 'suggesting' });
    try {
      const s = await suggestShopMediaTags(m.id);
      if (!alive.current) return;
      setDrafts((d) => {
        const cur = d[m.id];
        if (!cur || cur.status === 'saved') return d;
        return {
          ...d,
          [m.id]: {
            ...cur,
            title: cur.title || s.title || '',
            tags: [...new Set([...cur.tags, ...s.tags])].slice(0, MAX_TAGS),
            ai: s.tags,
            status: 'ready',
          },
        };
      });
    } catch {
      if (alive.current) patch(m.id, { status: 'failed' });
    }
  };

  const onFiles = async (files: File[]) => {
    if (!files.length) return;
    setErrors([]);
    setUploading({ done: 0, total: files.length });
    const uploaded: ShopMedia[] = [];
    for (const file of files) {
      try {
        const m = await uploadShopMedia(await shrink(file), '');
        if (!alive.current) return;
        uploaded.push(m);
        setPhotos((p) => [...p, m]);
        setDrafts((d) => ({ ...d, [m.id]: { title: '', tags: [], ai: [], status: 'suggesting' } }));
        onSaved(m, true);
      } catch (e) {
        setErrors((errs) => [...errs, `${file.name}: ${(e as Error).message}`]);
      }
      setUploading((u) => u && { ...u, done: u.done + 1 });
    }
    setUploading(null);
    for (const m of uploaded) {
      if (!alive.current) return;
      await suggest(m);
    }
  };

  const photo = photos[index];
  const draft = photo ? drafts[photo.id] : undefined;
  const savedCount = photos.filter((p) => drafts[p.id]?.status === 'saved').length;
  const allSaved = photos.length > 0 && savedCount === photos.length;

  const toggle = (tag: string) => {
    if (!photo || !draft) return;
    const has = draft.tags.includes(tag);
    if (!has && draft.tags.length >= MAX_TAGS) return;
    edit(photo.id, { tags: has ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag] });
  };

  const addTyped = () => {
    const tag = cleanTag(newTag);
    setNewTag('');
    if (tag && draft && !draft.tags.includes(tag)) toggle(tag);
  };

  const nextUnsaved = (from: number) => {
    for (let step = 1; step <= photos.length; step++) {
      const i = (from + step) % photos.length;
      if (drafts[photos[i].id]?.status !== 'saved' || i === from) return i;
    }
    return from;
  };

  const confirm = async () => {
    if (!photo || !draft) return;
    setSaving(true);
    setErrors([]);
    try {
      const m = await updateShopMedia(photo.id, { title: draft.title.trim(), tags: draft.tags });
      setPhotos((p) => p.map((x) => (x.id === m.id ? m : x)));
      patch(m.id, { status: 'saved', tags: m.tags, title: m.title ?? '' });
      onSaved(m, false);
      setIndex(nextUnsaved(index));
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setSaving(false);
    }
  };

  // Picking files: the empty state, before anything is uploaded.
  if (!photos.length) {
    return (
      <Modal open onClose={onClose} title="Upload Shop Photos" icon={ImagePlus} size="lg">
        <div className="p-4 overflow-y-auto">
          <button
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')));
            }}
            disabled={!!uploading}
            className="w-full border-2 border-dashed border-black bg-white p-10 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#FFF8E7] disabled:opacity-60"
          >
            <ImagePlus className="w-8 h-8 text-[#B8251B]" />
            <span className="font-mono text-xs font-bold">
              {uploading ? `UPLOADING ${uploading.done} / ${uploading.total}…` : 'CHOOSE PHOTOS OR DROP THEM HERE'}
            </span>
            <span className="font-mono text-[10px] text-black/60">
              JPG, PNG or WebP · select many at once · AI suggests a name and tags for each
            </span>
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              onFiles(files);
            }}
          />
          {errors.map((err) => (
            <p key={err} className="text-[10px] font-mono text-[#B8251B] mt-1.5">{err}</p>
          ))}
        </div>
      </Modal>
    );
  }

  const offered = [...new Set([...(draft?.ai ?? []), ...vocabulary])].filter((t) => !draft?.tags.includes(t));

  return (
    <Modal open onClose={onClose} title={`Tag Photos · ${savedCount} / ${photos.length} done`} icon={Tags} size="2xl">
      <div className="p-4 overflow-y-auto grid md:grid-cols-2 gap-4">
        {/* Left: the photo, arrows and a strip of thumbnails */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="relative bg-white border-2 border-black flex items-center justify-center h-[45vh] md:h-[55vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={draft?.title || 'shop photo'} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
            {photos.length > 1 && (
              <>
                <button
                  aria-label="Previous photo"
                  onClick={() => setIndex((index - 1 + photos.length) % photos.length)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-white border border-black p-1 cursor-pointer hover:bg-[#FAF3E0]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  aria-label="Next photo"
                  onClick={() => setIndex((index + 1) % photos.length)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-white border border-black p-1 cursor-pointer hover:bg-[#FAF3E0]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <span className="absolute bottom-1 left-1 bg-black text-white font-mono text-[10px] px-1.5">
              {index + 1} / {photos.length}
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={`relative shrink-0 w-14 h-14 border-2 cursor-pointer ${i === index ? 'border-[#B8251B]' : 'border-black/30'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                {drafts[p.id]?.status === 'saved' && (
                  <span className="absolute top-0 right-0 bg-emerald-700 text-white p-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: name and tags, then confirm */}
        <div className="flex flex-col gap-3 min-w-0">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold">PRODUCT NAME</span>
            <input
              value={draft?.title ?? ''}
              maxLength={255}
              onChange={(e) => edit(photo.id, { title: e.target.value })}
              placeholder="e.g. Red Matte Lipstick"
              className="border-2 border-black bg-white px-2 py-1.5 font-mono text-sm"
            />
          </label>

          <div>
            <span className="font-mono text-[10px] font-bold">
              SELECTED TAGS ({draft?.tags.length ?? 0}/{MAX_TAGS}) · click to remove
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1 min-h-7">
              {draft?.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => toggle(t)}
                  className="bg-[#1A2B4C] text-white font-mono text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-[#B8251B]"
                >
                  {draft.ai.includes(t) && <Sparkles className="w-3 h-3 text-amber-300" />}
                  {t}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {!draft?.tags.length && <span className="font-mono text-[10px] text-black/50 italic">No tags yet</span>}
            </div>
          </div>

          {draft?.status === 'suggesting' && (
            <p className="font-mono text-[10px] text-black/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E09A25] animate-pulse" /> AI is looking at this photo…
            </p>
          )}
          {draft?.status === 'failed' && (
            <p className="font-mono text-[10px] text-[#B8251B]">
              AI could not tag this photo. Add the tags by hand, or{' '}
              <button onClick={() => suggest(photo)} className="underline cursor-pointer">try again</button>.
            </p>
          )}
          {draft?.status !== 'suggesting' && !draft?.ai.length && draft?.status !== 'failed' && (
            <button
              onClick={() => suggest(photo)}
              className="self-start font-mono text-[10px] font-bold flex items-center gap-1 text-[#B8251B] hover:text-black cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> SUGGEST WITH AI
            </button>
          )}

          {offered.length > 0 && (
            <div>
              <span className="font-mono text-[10px] font-bold">ADD A TAG · AI suggestions and your shop&apos;s tags</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {offered.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className="border border-black bg-white font-mono text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-[#FAF3E0]"
                  >
                    {draft?.ai.includes(t) && <Sparkles className="w-3 h-3 text-[#E09A25]" />}+ {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTyped();
            }}
            className="flex gap-1.5"
          >
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              maxLength={30}
              placeholder="Type a new tag and press Enter"
              className="flex-1 min-w-0 border border-black bg-white px-2 py-1 font-mono text-xs"
            />
            <button type="submit" className="border border-black bg-white px-2 font-mono text-xs cursor-pointer hover:bg-[#FAF3E0]">
              ADD
            </button>
          </form>

          {errors.map((err) => (
            <p key={err} className="text-[10px] font-mono text-[#B8251B]">{err}</p>
          ))}

          <div className="mt-auto flex gap-2 pt-2 border-t-2 border-black">
            {allSaved ? (
              <button onClick={onClose} className="flex-1 bg-emerald-700 text-white font-mono text-xs font-bold py-2 cursor-pointer">
                ALL {photos.length} PHOTOS TAGGED · CLOSE
              </button>
            ) : (
              <>
                {photos.length > 1 && (
                  <button
                    onClick={() => setIndex(nextUnsaved(index))}
                    className="border-2 border-black bg-white font-mono text-xs font-bold px-3 py-2 cursor-pointer hover:bg-[#FAF3E0]"
                  >
                    SKIP
                  </button>
                )}
                <button
                  onClick={confirm}
                  disabled={saving || !draft || draft.status === 'saved'}
                  className="flex-1 bg-[#1A2B4C] text-white font-mono text-xs font-bold py-2 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {draft?.status === 'saved' ? 'SAVED' : saving ? 'SAVING…' : 'CONFIRM'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
