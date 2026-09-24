'use client';

import { useEffect, useState } from 'react';
import { Loader } from '../../src/components/Loader';
import { PageHeader } from '../../src/components/PageHeader';
import { getDashboard, type ChannelCounts, type Dashboard } from '../../src/api';

const LABELS: Record<keyof ChannelCounts, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

// Plain text blocks; spacing only, no rules or borders.
function Counts({ title, counts }: { title: string; counts: ChannelCounts }) {
  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-widest mb-3">{title}</h2>
      {(Object.keys(LABELS) as (keyof ChannelCounts)[]).map((ch) => (
        <p key={ch} className="flex justify-between max-w-xs py-0.5">
          <span>{LABELS[ch]}</span>
          <span className="font-bold tabular-nums">{counts[ch]}</span>
        </p>
      ))}
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col aged-paper text-[#1A1A1A]">
      <PageHeader
        activeTab="dashboard"
        escalations={data ? Object.values(data.handover).reduce((a, b) => a + b, 0) : 0}
      />
      {error ? (
        <p className="p-8 font-mono text-[#B8251B]">{error}</p>
      ) : !data ? (
        <Loader />
      ) : (
        <main className="font-mono p-6 sm:p-10">
          <h1 className="text-2xl font-serif font-black uppercase">Dashboard</h1>
          <p className="text-xs text-stone-600 mt-1">
            Last {data.window_days === 1 ? '24 hours' : `${data.window_days} days`}
          </p>

          <div className="mt-10 grid gap-12 sm:grid-cols-2 max-w-3xl">
            <Counts title="New messages" counts={data.new_messages} />

            <section>
              <h2 className="text-sm font-black uppercase tracking-widest mb-3">Queries</h2>
              {data.top_queries.length === 0 && <p className="text-stone-600">No queries yet</p>}
              <ol className="list-decimal list-inside space-y-1">
                {data.top_queries.map((q) => (
                  <li key={q.text}>
                    {q.text} <span className="text-stone-600">({q.count})</span>
                  </li>
                ))}
              </ol>
            </section>

            <Counts title="Messages handled" counts={data.messages_handled} />
            <Counts title="Handover" counts={data.handover} />
          </div>
        </main>
      )}
    </div>
  );
}
