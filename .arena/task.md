# Task: review and flow-check the Sanchar frontend (Next.js) for the Instagram login → dashboard → conversations flow

## The request, in the user's words

"so this is the directory of my multiple chat gatherer application from meta. we are in testing and developmental phase and this dir is for frontend made in next as so it will be helpful for seo later on. here the flow is the application user or a tenant who wants feature of auto reply in all of its social media can directly link or login from their desired social media and then look at different metrics collected in the dashboard, conversations are listed as per social media in left hand side and then the each conversation messages can be seen when clicking conversations. user logs into the using instagram and then is to be shown dashboard with all the metrics available. do a review a flow check"

Correction the user sent right after: "its on right" — i.e. the per-social-media conversation list is on the RIGHT-hand side, not the left.

## What the product is

- A multi-channel chat gatherer / auto-reply app built on Meta platforms (Instagram, Facebook, WhatsApp). Name in the code: "Sanchar".
- A tenant (the app's user) wants AI auto-reply across all of their social media. They link or log in directly with their chosen social account, then see metrics on a dashboard, a per-channel list of conversations, and the messages of a conversation when they click it.
- The project is in testing and development.
- The frontend is Next.js (App Router, Next 15, React 19, Tailwind 4, lucide-react). It was chosen partly so SEO work is possible later.

## The expected flow to check

1. A tenant arrives unauthenticated → login page.
2. The tenant logs in with Instagram (the OAuth redirect goes through the backend). Errors come back to the login page.
3. After an Instagram login, the tenant is shown the **dashboard with all the metrics available**.
4. The tenant can see conversations listed per social media (the list is on the right-hand side) and click a conversation to see its messages.
5. The tenant can link their other social accounts (WhatsApp, Facebook, Instagram) from inside the app.

## Where the code is (read anything you need; change nothing)

Frontend (the thing under review): `C:\Users\Acer\Documents\development\next-app`
- `middleware.ts`: session-cookie (`ns_session`) gate, `/api/v1/*` proxied to FastAPI via `BACKEND_URL`, webhooks excluded
- `app/login/page.tsx`: email/password login plus the Instagram login button
- `app/page.tsx`: renders `src/App.tsx` client-only
- `app/dashboard/page.tsx`: the metrics dashboard
- `app/layout.tsx`, `app/loading.tsx`, `next.config.ts`, `.env.example`, `Dockerfile`, `docker-compose.yml`
- `app/api/meta/*`, `app/api/health/route.ts`, `app/api/amit/page.tsx`
- `src/api.ts`: all backend calls (login, logout, tenant, Instagram login URL, conversations, messages, dashboard, IG profiles, WhatsApp accounts/linking, sendReply, askAi)
- `src/App.tsx`, `src/types.ts`, `src/mockData.ts`
- `src/components/*`: InboxFeed, RightInspector, SidebarNav, Header, PageHeader, MetaSettingsModal (channel linking), ProfileModal, InboundSimulatorModal, InventoryModal, RAGSandboxModal, etc.
- `conversation_example.json`: a sample conversation payload

Backend, for reference only (FastAPI; it is NOT the thing under review, but read it to check that the frontend's contracts match): `C:\Users\Acer\Documents\development\nepsocial-backend`
- `app/api/v1/auth.py`, `app/api/v1/social_accounts.py`, `app/api/v1/dashboard.py`, `app/api/v1/webhooks.py`, `app/api/v1/__init__.py`
- `app/core/security.py`, `app/core/tenant.py`, `app/core/config.py`, `app/schemas/`
- `tests/`

## What "done" looks like

A review and flow check of the frontend written for the developer: walk the flow above end to end through the actual code and report where it works, where it breaks or diverges from the intended flow, and what to change. Point every finding at a file and line. Where a fix is needed, give the exact change (a snippet or a unified diff). Do not apply any change to either repo.
