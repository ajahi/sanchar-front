'use client';

import dynamic from 'next/dynamic';

// ssr:false — the dashboard is a pure client-side app (mock data, timers); nothing to prerender.
const App = dynamic(() => import('../src/App'), { ssr: false });

export default function Page() {
  return <App />;
}
