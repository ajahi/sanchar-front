'use client';

import dynamic from 'next/dynamic';

// ssr:false — App reads localStorage during render (auth state); skip SSR to keep
// behavior identical to the original SPA and avoid hydration mismatch.
const App = dynamic(() => import('../src/App'), { ssr: false });

export default function Page() {
  return <App />;
}
