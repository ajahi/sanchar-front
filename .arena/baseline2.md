I read the whole flow and typechecked it; `tsc` passes. The main gap is that signing in with Instagram lands the user on the inbox, not the dashboard. I traced the code but didn't run it against your backend, so the backend redirect and the response shapes are unchecked.

## The flow

1. **Login.** `/login` links to `/api/v1/social-accounts/instagram/login`, which the middleware rewrites to FastAPI.
2. **Callback.** The backend sets the `ns_session` cookie, and `/login?ig_error=…` carries any failure. The middleware keeps that query string, which is correct.
3. **Landing.** A user with a session who hits `/login` is redirected to `/` (`middleware.ts:20`). The email login also does `location.assign('/')` (`login/page.tsx:34`).
4. **Inbox and dashboard.** `/` is the inbox and `/dashboard` is a separate page reached through a header link.

## Bugs, most important first

1. **The user doesn't land on the dashboard.** Both entry paths end at `/`, the inbox. To match your intended flow, change those two redirects, plus the backend's OAuth callback redirect, to `/dashboard`. The backend redirect is the piece I couldn't see, so check it.
2. **Human takeover doesn't stick.** `handleToggleTakeover` (`App.tsx:122`) only changes local state. The 5-second poll replaces `status` with the server's `mode`, so the toggle reverts within 5 seconds. It needs a PATCH endpoint on the backend.
3. **Sidebar previews are empty for most threads.** Messages are only fetched for the open thread, so every other thread shows "No messages yet" (`SidebarNav.tsx:~150`). The conversations endpoint should return a `last_message` preview.
4. **Every real thread shows `CONF: 0.00`.** `confidenceScore` is never set from the API. Hide the badge when it's undefined.
5. **Static files redirect to login.** The current matcher no longer excludes paths with a file extension; the old `.bak` did. `robots.txt`, `sitemap.xml`, og images and `/public/*` all redirect to `/login` for logged-out visitors, which breaks the SEO you mentioned. Put `.*\\..*` back in the exclusion.
6. **Expired sessions fail silently in the inbox.** `getMyTenant` runs once at mount. If the cookie expires later, the 5-second poll just logs errors to the console and the user is never sent back to `/login`. The dashboard page handles this better.

## Dashboard

- The window is fixed at `days=1` in `getDashboard()`, with no selector and no refresh.
- It always shows WhatsApp, Facebook and Instagram rows, including channels the tenant hasn't connected. A user who just logged in with Instagram sees a wall of zeros and no "connect WhatsApp" prompt. Show only connected channels, and add an empty state with a link to Channels.
- The header escalation badge on the dashboard is the sum of `handover` counts over the window. The inbox badge counts threads currently in `NEEDS_HUMAN`. These are two different numbers under the same label.
- The response is trusted as-is. If the backend omits a channel key, the page shows `undefined`.

## Mock data that looks real

- **Fake connection status.** `initialMetaStatus` in `mockData.ts` hardcodes "Himalayan Silk", a fake Facebook page and a fake WhatsApp number as connected. The Channels modal cards use it, and the "ACTIVE CHANNELS" stamp and "Meta Webhooks 200 OK" in the RightInspector are static. A tenant with no channels connected still sees everything green.
- **Simulator and sandbox.** `+ INBOUND`, `SIMULATE CUSTOMER`, the RAG sandbox and "AI draft" all call `/api/v1/ai/reply`, which currently returns 404. Simulated threads are wiped by the next poll. Hide them behind a dev flag.
- **Placeholders.** Catalog and FAQ data are mock. Token usage (412) and latency (120 ms) in the footer are fake numbers.
- **`alert()` on send failure.** Replace it with an inline error.

## Cleanup and Meta app review

- `app/api/meta/*` is dead mock code. `test-connection` always returns success. `webhook` is unauthenticated, skips HMAC verification, and writes to in-memory logs. Your real webhook goes to FastAPI, so delete this folder. `app/api/health` also mentions Gemini and "SocialSync", which is a leftover.
- Also delete `app/api/amit/page.tsx` and `middleware.ts.bak`, and untrack `tsconfig.tsbuildinfo`.
- Terms of service and privacy policy on the login page are plain `<span>`s, not links. Meta app review requires a real privacy policy URL, and a data-deletion URL for Instagram and Facebook login. Build these before you submit.
- SEO: the app is `ssr:false` and login-gated, so only `/login` is indexable. That's fine, but for SEO you'll want a public landing page (`/`) and the inbox moved to `/inbox`. The current `/` redirects crawlers to login.
