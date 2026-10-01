import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Send, Trash2 } from 'lucide-react';
import type { ChatMessage, ConversationThread } from '../types';
import {
  ShopMedia,
  deleteShopMedia,
  listShopMedia,
  sendShopMedia,
  updateShopMedia,
  uploadShopMedia,
} from '../api';

interface Props {
  activeThread: ConversationThread | null;
  onSent: (msg: ChatMessage) => void;
}

// Reference images for every conversation: the page's latest Instagram posts + admin uploads.
// Send puts one in the open chat; SOLD OUT tells the bot (and the admins) the item is gone.
export const ShopMediaPanel: React.FC<Props> = ({ activeThread, onSent }) => {
  const [items, setItems] = useState<ShopMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listShopMedia()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const replace = (m: ShopMedia) => setItems((prev) => prev.map((x) => (x.id === m.id ? m : x)));

  const run = async (id: string, job: () => Promise<void>) => {
    setBusy(id);
    setError('');
    try {
      await job();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const title =
      window.prompt('Product name for this photo (the bot uses it when marked sold out):', file.name.replace(/\.[^.]+$/, '')) ?? '';
    run('upload', async () => {
      const m = await uploadShopMedia(file, title);
      setItems((prev) => [m, ...prev]);
    });
  };

  const rename = (m: ShopMedia) => {
    const title = window.prompt('Product name:', m.title ?? '');
    if (title === null || !title.trim()) return;
    run(m.id, async () => replace(await updateShopMedia(m.id, { title: title.trim() })));
  };

  const canSend = !!activeThread && activeThread.channel === 'instagram';

  return (
    <div className="matchbox-border p-3 bg-white">
      <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
        <h3 className="serif-heading text-base tracking-tight text-[#1A2B4C]">Shop Photos</h3>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy === 'upload'}
          className="text-[9px] font-bold font-mono flex items-center gap-1 text-[#B8251B] hover:text-black cursor-pointer disabled:opacity-50"
        >
          <ImagePlus className="w-3 h-3" />
          {busy === 'upload' ? 'UPLOADING…' : 'UPLOAD'}
        </button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onUpload} />
      </div>

      {error && <p className="text-[10px] font-mono text-[#B8251B] mb-1.5">{error}</p>}
      {loading && <p className="text-[10px] font-mono text-black/50">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-[10px] font-mono text-black/50 italic">No photos yet. Upload one, or connect Instagram.</p>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {items.map((m) => (
          <div key={m.id} className="border border-black bg-[#FAF3E0] flex flex-col">
            <div className="relative aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.title ?? 'shop photo'}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${m.in_stock ? '' : 'grayscale opacity-60'}`}
              />
              {!m.in_stock && (
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#B8251B] text-white text-[8px] font-bold font-mono text-center">
                  SOLD OUT
                </span>
              )}
              {m.media_type === 'VIDEO' && (
                <span className="absolute top-0 left-0 bg-black text-white text-[8px] font-mono px-1">REEL</span>
              )}
              {m.source === 'upload' && (
                <button
                  title="Delete photo"
                  onClick={() => {
                    if (!window.confirm('Delete this photo?')) return;
                    run(m.id, async () => {
                      await deleteShopMedia(m.id);
                      setItems((prev) => prev.filter((x) => x.id !== m.id));
                    });
                  }}
                  className="absolute top-0 right-0 bg-white/80 hover:bg-white p-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-[#B8251B]" />
                </button>
              )}
            </div>
            <button
              title="Rename"
              onClick={() => rename(m)}
              className="text-[9px] font-mono truncate px-1 pt-0.5 text-left cursor-pointer hover:underline"
            >
              {m.title || 'Add name'}
            </button>
            <div className="flex border-t border-black/30 mt-0.5">
              <button
                disabled={!canSend || busy === m.id}
                title={canSend ? 'Send to this customer' : 'Open an Instagram chat to send'}
                onClick={() => run(m.id, async () => onSent(await sendShopMedia(activeThread!.id, m.id)))}
                className="flex-1 py-0.5 flex justify-center bg-[#1A2B4C] text-white disabled:opacity-30 cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
              <button
                disabled={busy === m.id}
                title={m.in_stock ? 'Mark sold out' : 'Mark back in stock'}
                onClick={() => run(m.id, async () => replace(await updateShopMedia(m.id, { in_stock: !m.in_stock })))}
                className={`flex-1 text-[8px] font-bold font-mono py-0.5 cursor-pointer ${
                  m.in_stock ? 'bg-[#E09A25] text-black' : 'bg-emerald-700 text-white'
                }`}
              >
                {m.in_stock ? 'SOLD?' : 'RESTOCK'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
