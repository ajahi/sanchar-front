'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../src/components/Loader';

// ssr:false — the dashboard is a pure client-side app (mock data, timers); nothing to prerender.
// Without `loading`, the page is blank until the bundle arrives (e.g. right after the Instagram redirect).
const App = dynamic(() => import('../src/App'), { ssr: false, loading: () => <Loader /> });

export default function Page() {
  return <App />;
}
