import type { Metadata } from 'next';
import './globals.css';

const title = 'Sanchar AI — Omnichannel RAG Dispatch';
const description =
  'Sanchar safety matchbox-styled omnichannel customer support and sales automation platform with Context-Aware RAG in Nepali, Nepglish, and English for social commerce merchants.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,300..700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* theme-clean + theme-soft: the cream app-wide look (globals.css); /new-theme nests its own theme-clean on top */}
      <body className="theme-clean theme-soft">{children}</body>
    </html>
  );
}
