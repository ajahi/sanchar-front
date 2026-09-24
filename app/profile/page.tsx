'use client';

import { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';
import { Loader } from '../../src/components/Loader';
import { PageHeader } from '../../src/components/PageHeader';
import { getInstagramProfiles, type InstagramProfile } from '../../src/api';

const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString());

// The connected Instagram professional account(s), from instagram_business_basic.
function ProfileCard({ p }: { p: InstagramProfile }) {
  const rows: [string, string][] = [
    ['Username', p.username ? `@${p.username}` : '—'],
    ['Name', p.name ?? '—'],
    ['Instagram ID', p.id],
    ['Account type', p.account_type ?? '—'],
    ['Followers', fmt(p.followers_count)],
    ['Following', fmt(p.follows_count)],
    ['Posts', fmt(p.media_count)],
    ['Connected', new Date(p.connected_at).toLocaleDateString()],
  ];
  return (
    <section className="flex flex-col sm:flex-row gap-6 sm:gap-10">
      {p.profile_picture_url ? (
        <img
          src={p.profile_picture_url}
          alt={`${p.username ?? 'Instagram'} profile picture`}
          className="w-28 h-28 rounded-full border-4 border-black object-cover shrink-0"
        />
      ) : (
        <div className="w-28 h-28 rounded-full border-4 border-black flex items-center justify-center shrink-0">
          <Instagram className="w-10 h-10 text-[#B8251B]" />
        </div>
      )}
      <div className="min-w-0">
        {rows.map(([k, v]) => (
          <p key={k} className="flex gap-6 py-0.5">
            <span className="w-28 shrink-0 text-stone-600">{k}</span>
            <span className="font-bold break-all">{v}</span>
          </p>
        ))}
        {!p.live && (
          <p className="mt-3 text-xs text-[#B8251B]">
            Instagram didn&apos;t respond — showing saved details. Log in with Instagram again to refresh.
          </p>
        )}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<InstagramProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInstagramProfiles().then(setProfiles).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col aged-paper text-[#1A1A1A]">
      <PageHeader activeTab="profile" />
      {error ? (
        <p className="p-8 font-mono text-[#B8251B]">{error}</p>
      ) : !profiles ? (
        <Loader />
      ) : (
        <main className="font-mono p-6 sm:p-10">
          <h1 className="text-2xl font-serif font-black uppercase">Instagram profile</h1>
          <p className="text-xs text-stone-600 mt-1">The Instagram professional account connected to Sanchar</p>
          <div className="mt-10 flex flex-col gap-12 max-w-3xl">
            {profiles.length === 0 ? (
              <p className="text-stone-600">No Instagram account connected yet.</p>
            ) : (
              profiles.map((p) => <ProfileCard key={p.id} p={p} />)
            )}
          </div>
        </main>
      )}
    </div>
  );
}
