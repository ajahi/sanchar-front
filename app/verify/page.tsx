'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader } from '../../src/components/Loader';
import { verifyEmail } from '../../src/api';

function Verify() {
  const token = useSearchParams().get('token');
  const [error, setError] = useState<string | null>(token ? null : 'This confirmation link is invalid');
  const ran = useRef(false); // StrictMode double-invokes effects

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    verifyEmail(token)
      .then(() => window.location.assign('/')) // full load so middleware sees the new cookie
      .catch((e) => setError(e.message));
  }, [token]);

  if (!error) return <Loader />;
  return (
    <div className="min-h-screen aged-paper flex flex-col items-center justify-center gap-4 font-mono p-6">
      <p role="alert" className="font-bold text-[#B8251B]">{error}</p>
      <a href="/login" className="underline font-bold">Back to log in</a>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Verify />
    </Suspense>
  );
}
