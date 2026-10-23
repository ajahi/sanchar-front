'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, Instagram, Mail, Phone } from 'lucide-react';
import { SancharLogo } from '../../src/components/SancharLogo';
import { Loader } from '../../src/components/Loader';
import { INSTAGRAM_LOGIN_URL, getMe, login, register, resendVerification } from '../../src/api';

// three.js is split into its own chunk and only loads on this page.
const BubbleScene = dynamic(() => import('../../src/components/BubbleScene'), { ssr: false });

const input =
  'w-full rounded-xl border border-[#E6D9BF] bg-[#FFFBF2] px-4 py-3 text-[15px] text-[#2A211B] placeholder-[#A89A86] focus:border-[#CC3316] focus:outline-none focus:ring-4 focus:ring-[#CC3316]/15';
const label = 'mb-1.5 block text-xs font-semibold text-[#6B5D4F]';

const CONTACTS = [
  { href: 'mailto:contact@utsavupahar.com', text: 'contact@utsavupahar.com', Icon: Mail },
  { href: 'mailto:himaliamit1@gmail.com', text: 'himaliamit1@gmail.com', Icon: Mail },
  { href: 'tel:+9779765944008', text: '9765944008', Icon: Phone },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [sentTo, setSentTo] = useState<string | null>(null); // set once the confirmation email is out
  const [needsConfirm, setNeedsConfirm] = useState(false); // login rejected: email not confirmed yet
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [igHot, setIgHot] = useState(false); // Instagram button hovered: its bubble swells
  const signup = mode === 'signup';

  // Instagram callback failures come back as /login?ig_error=...&ig_error_description=...
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('mode') === 'signup') setMode('signup'); // shareable link: /login?mode=signup
    const igError = q.get('ig_error');
    if (igError) setError(`Instagram login failed: ${igError} ${q.get('ig_error_description') ?? ''}`.trim());
    // Back button from Instagram restores this page from bfcache with the loader still up.
    const reset = (e: PageTransitionEvent) => e.persisted && setIsLoading(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsConfirm(false);
    try {
      if (signup) {
        await register({ name: name.trim(), business_name: businessName.trim(), email: email.trim(), password });
        setSentTo(email.trim());
        setIsLoading(false);
        return;
      }
      await login(email.trim(), password);
      const isSuper = (await getMe().catch(() => null))?.roles.includes('super_admin');
      window.location.assign(isSuper ? '/admin' : '/'); // full load so middleware sees the new cookie
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setNeedsConfirm(msg.startsWith('Please confirm your email'));
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification((sentTo ?? email).trim());
      setError(null);
      setSentTo((sentTo ?? email).trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#2A211B]">
      {isLoading && <Loader />}

      {/* 3D bubbles: top of the page on mobile, the area left of the card on desktop */}
      <div className="absolute inset-x-0 top-0 h-[58vh] lg:fixed lg:inset-0 lg:h-auto">
        <BubbleScene hot={igHot} />
      </div>

      <header className="relative z-10 flex items-center gap-3 px-5 pt-5 sm:px-10 sm:pt-8">
        <span className="btn-pop flex h-9 w-9 items-center justify-center rounded-xl p-1.5">
          <SancharLogo className="h-6 w-6 text-[#FFFBF2]" />
        </span>
        <span className="text-lg font-semibold" style={{ letterSpacing: '.22em' }}>SANCHAR</span>
        <span className="text-sm font-semibold text-[#CC3316]">सञ्चार</span>
      </header>

      <div className="pointer-events-none relative z-10 px-5 pt-[30vh] sm:px-10 lg:fixed lg:bottom-10 lg:pt-0">
        <h1 className="max-w-xl text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
          Automate your <span className="text-[#CC3316]">social replies.</span>
        </h1>
        <p className="mt-3 max-w-md text-[#6B5D4F]">
          We&apos;re helping small businesses grow by automating their social media. Connect Instagram, WhatsApp and
          Messenger in one place, and Sanchar answers your customers in Nepali, Nepglish and English.
        </p>
        <section aria-label="Contact us" className="pointer-events-auto mt-4 flex max-w-lg flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 font-semibold">Get in touch:</span>
          {CONTACTS.map(({ href, text, Icon }) => (
            <a
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9BF] bg-[#FFFBF2]/80 px-3 py-1.5 backdrop-blur transition hover:border-[#CC3316] hover:text-[#CC3316]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#CC3316]" />
              {text}
            </a>
          ))}
        </section>
      </div>

      <main className="relative z-10 mx-4 mb-10 mt-8 sm:mx-auto sm:max-w-md lg:fixed lg:right-12 lg:top-1/2 lg:m-0 lg:w-[420px] lg:-translate-y-1/2">
        <div className="rounded-3xl border border-[#E6D9BF] bg-[#FFFBF2]/75 p-7 shadow-2xl shadow-amber-900/15 backdrop-blur-xl sm:p-8">
          <h2 className="text-3xl font-semibold">{sentTo ? 'Check your inbox' : signup ? 'Create account' : 'Welcome back'}</h2>
          <p className="mb-6 mt-1.5 text-sm text-[#6B5D4F]">
            {sentTo ? 'One more step to activate your account.' : signup ? 'Start automating replies in minutes.' : 'Log in to your Sanchar workspace.'}
          </p>

          {!sentTo && (
            <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#F1E6CC] p-1 text-sm font-semibold">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  id={`tab-${m}`}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => { setMode(m); setError(null); setNeedsConfirm(false); }}
                  className={`cursor-pointer rounded-xl py-2.5 transition ${mode === m ? 'bg-[#FFB627] text-[#2A211B] shadow-sm' : 'text-[#6B5D4F] hover:text-[#2A211B]'}`}
                >
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>
          )}

          {!sentTo && (
            <>
              {signup && (
                <p className="mb-3 text-xs leading-snug text-[#6B5D4F]">
                  <b className="text-[#2A211B]">Have an Instagram business page?</b> Sign up in one click, with no form and no email
                  confirmation. No Instagram? Use the email form below.
                </p>
              )}
              <a
                id="btn-auth-instagram"
                href={INSTAGRAM_LOGIN_URL}
                onClick={() => setIsLoading(true)}
                onPointerEnter={() => setIgHot(true)}
                onPointerLeave={() => setIgHot(false)}
                onFocus={() => setIgHot(true)}
                onBlur={() => setIgHot(false)}
                className="btn-ig flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-semibold"
              >
                <Instagram className="h-5 w-5 shrink-0" />
                <span>{signup ? 'Sign up with Instagram' : 'Log in with Instagram'}</span>
              </a>

              <div className="my-5 flex items-center gap-3 text-xs text-[#A89A86]">
                <span className="h-px flex-1 bg-[#E6D9BF]" />or / अथवा<span className="h-px flex-1 bg-[#E6D9BF]" />
              </div>
            </>
          )}

          {sentTo ? (
            <div className="space-y-3 text-sm">
              <p>We sent a confirmation link to <b>{sentTo}</b>. Open it to activate your account.</p>
              {error && <p role="alert" className="text-xs font-semibold text-[#B8251B]">{error}</p>}
              <button type="button" onClick={handleResend} className="cursor-pointer font-semibold text-[#CC3316] underline">
                Resend email
              </button>
              <div>
                <button type="button" onClick={() => { setSentTo(null); setMode('login'); }} className="cursor-pointer underline">
                  Back to log in
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {signup && (
                <>
                  <div>
                    <label htmlFor="input-name" className={label}>Your name</label>
                    <input id="input-name" value={name} onChange={(e) => setName(e.target.value)} required className={input} />
                  </div>
                  <div>
                    <label htmlFor="input-business" className={label}>Business name</label>
                    <input id="input-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className={input} />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="input-work-email" className={label}>Work email</label>
                <input
                  id="input-work-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="input-password" className={label}>Password</label>
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={signup ? 8 : undefined}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  className={input}
                />
              </div>
              {error && <p role="alert" className="text-xs font-semibold text-[#B8251B]">{error}</p>}
              {needsConfirm && (
                <button type="button" onClick={handleResend} className="cursor-pointer text-xs font-semibold text-[#CC3316] underline">
                  Resend confirmation email
                </button>
              )}

              <button
                id="btn-submit-cta"
                type="submit"
                disabled={isLoading}
                className="btn-pop flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-semibold"
              >
                <span>{isLoading ? 'Signing in…' : signup ? 'Create account' : 'Log in to Sanchar'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-[11px] leading-snug text-[#8A7B69]">
                By continuing, you agree to Sanchar&apos;s <span className="cursor-pointer underline">terms of service</span> and{' '}
                <span className="cursor-pointer underline">privacy policy</span>.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
