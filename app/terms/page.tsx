import type { Metadata } from 'next';
import { H, LegalPage, UL } from '../../src/components/Legal';

export const metadata: Metadata = { title: 'Terms of Service · Sanchar' };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p className="mt-4">By using Sanchar you agree to these terms. If you do not agree, please do not use it.</p>

      <H>The service</H>
      <p>
        Sanchar helps small businesses manage content, customer conversations and business information, with a shared inbox, automatic replies, a multilingual
        chatbot and analytics. You are responsible for keeping your login private and for the actions of the staff you add.
      </p>

      <H>Your content and data</H>
      <p>
        You keep ownership of what you upload, publish or store in Sanchar, including your business information and your customers&apos; messages. You give us permission to
        store, process and transmit it as needed to run the service, including sending it to AI services to produce replies and posting it to the accounts you choose.
        You confirm you have the right to use it.
      </p>

      <H>Automatic replies and AI</H>
      <p>
        Replies written by AI can be wrong. You are responsible for the answers your business gives customers, for reviewing the information and settings that guide
        the chatbot, and for turning automatic replies off where a person should answer instead. Do not rely on Sanchar for legal, medical or financial advice.
      </p>

      <H>Acceptable use</H>
      <UL>
        <li>No unlawful, infringing, hateful, deceptive or harmful content, and no spam or unsolicited bulk messaging.</li>
        <li>No attempts to break, overload or gain unauthorised access to the service.</li>
        <li>You must follow the rules of each platform you connect (Meta, TikTok and others). Content and messages sent through a platform are also governed by that platform&apos;s terms.</li>
      </UL>

      <H>Connected accounts</H>
      <p>
        Connecting an Instagram, WhatsApp, Facebook or TikTok account lets Sanchar read and send messages and publish content on the business&apos;s behalf, within the
        permissions you grant. You can disconnect an account at any time. We are not responsible for a platform&apos;s decision to remove content, limit an account or change
        its API.
      </p>

      <H>Availability</H>
      <p>We aim to keep Sanchar running but do not promise it will be uninterrupted or error-free. We may change or end features with reasonable notice.</p>

      <H>Liability</H>
      <p>
        The service is provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect or consequential loss, lost sales, or loss caused by AI-generated
        replies or third-party platforms.
      </p>

      <H>Ending access</H>
      <p>We may suspend an account that breaks these terms. You may stop using Sanchar at any time and ask us to delete your data (see the Privacy Policy).</p>

      <H>Changes</H>
      <p>We may update these terms; the date above shows the latest version. Continued use means you accept the update.</p>
    </LegalPage>
  );
}
