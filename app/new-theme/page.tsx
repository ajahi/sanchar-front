'use client';

import dynamic from 'next/dynamic';
import { Loader } from '../../src/components/Loader';
import { ThemeScope } from '../../src/components/ThemeScope';

const App = dynamic(() => import('../../src/App'), { ssr: false, loading: () => <Loader /> });

export default function Page() {
  return (
    <ThemeScope>
      <App publicMode />
    </ThemeScope>
  );
}
