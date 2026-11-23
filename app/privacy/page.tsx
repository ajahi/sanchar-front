import type { Metadata } from 'next';
import { H, LegalPage, UL } from '../../src/components/Legal';

export const metadata: Metadata = { title: 'Privacy Policy · Sanchar' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="mt-4">
        Sanchar (&quot;we&quot;, &quot;us&quot;) is an AI-powered platform that helps small businesses manage their content, customer conversations and business
        information. This policy explains what we collect and how we use it.
      </p>

      <H>What we collect</H>
      <UL>
        <li><b>Account details:</b> name, business name, email address, phone number and a hashed password (never stored in readable form).</li>
        <li><b>Business information:</b> shop details, products, prices and other knowledge a business adds so Sanchar can answer customers accurately.</li>
        <li><b>Customer conversations:</b> messages sent to a business&apos;s connected Instagram, WhatsApp or Facebook accounts, with the sender&apos;s name or handle and the replies sent.</li>
        <li><b>Content:</b> posts, images and videos a business prepares or publishes through Sanchar.</li>
        <li><b>Connected accounts:</b> when a business connects a social account we receive its ID, username and an access token. Tokens are stored encrypted.</li>
        <li><b>Usage and analytics:</b> message volumes, response activity and content performance, shown to the business in its dashboard.</li>
      </UL>

      <H>How we use it</H>
      <UL>
        <li>To run the service: sign-in, the shared inbox, staff access and notifications.</li>
        <li>To generate suggested and automatic replies, including in Nepali, Nepglish and English. Message text and the business&apos;s own information are processed by AI services to produce a reply.</li>
        <li>To publish content to a connected account only when an authorised person on that business&apos;s team chooses to post.</li>
        <li>To show the business analytics about its content and conversations.</li>
        <li>To keep the service secure and fix problems.</li>
      </UL>
      <p className="mt-2">We do not sell personal data, use it for advertising, or use one business&apos;s data to answer another business&apos;s customers.</p>

      <H>TikTok</H>
      <p>
        If a business connects a TikTok account, we use TikTok&apos;s Login Kit and Content Posting API to read the basic profile (username and avatar) and to upload or
        publish videos the account owner has approved in Sanchar. We do not read private messages, followers or other TikTok content. The owner can disconnect the
        account in Sanchar, or revoke access in TikTok under Settings and privacy, Security and permissions, Apps and services. Disconnecting deletes the stored token.
      </p>

      <H>Meta (Instagram, WhatsApp, Facebook)</H>
      <p>
        Connected Meta accounts are used to receive and send the business&apos;s customer messages and to publish content the business chooses to post. Data from Meta
        is used only to provide those features and is handled under Meta&apos;s own policies as well as this one.
      </p>

      <H>Services we rely on</H>
      <UL>
        <li>Hosting and file storage providers.</li>
        <li>AI language-model services, to generate replies.</li>
        <li>Meta and TikTok, for the integrations above.</li>
        <li>An email provider, for account and notification emails.</li>
      </UL>

      <H>Retention and deletion</H>
      <p>
        We keep data while the business account is active. A business can ask us to delete its account, conversations or connected-account tokens, and we will do so
        except where the law requires us to keep a record. Customers who messaged a business can ask that business, or us, to delete their messages.
      </p>

      <H>Security</H>
      <p>Connections use HTTPS, passwords are hashed and social tokens are encrypted. Access is limited to the business&apos;s own team and the people who run the service.</p>

      <H>Your rights</H>
      <p>You can ask to see, correct or delete the personal data we hold about you by contacting us below.</p>

      <H>Changes</H>
      <p>If we change this policy we will update the date above.</p>
    </LegalPage>
  );
}
