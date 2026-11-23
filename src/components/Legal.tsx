import type { ReactNode } from 'react';

// Shared shell for the public /privacy and /terms pages.
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[15px] leading-relaxed text-[#2A211B]">
      <nav className="flex gap-5 text-sm font-semibold text-[#CC3316]">
        <a href="/login">Sanchar</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </nav>
      <h1 className="mt-6 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-[#6B5D4F]">Last updated: 23 November 2026</p>
      {children}
      <H>Contact</H>
      <p>
        Questions about this page: <a className="font-semibold text-[#CC3316]" href="mailto:contact@utsavupahar.com">contact@utsavupahar.com</a>
      </p>
    </main>
  );
}

export const H = ({ children }: { children: ReactNode }) => <h2 className="mb-2 mt-8 text-lg font-bold">{children}</h2>;
export const UL = ({ children }: { children: ReactNode }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>;
