# Task: review and flow-check a Next.js frontend for an Instagram-login -> dashboard -> conversations flow

## The request, in the user's words

"so this is the directory of my multiple chat gatherer application from meta. we are in testing and developmental phase and this dir is for frontend made in next as so it will be helpful for seo latteron. here the flow is the application user or a tenant who wants feature of auto reply in all of its social media can directly link or login from their desired social media and then look at different metrics colected in the dashboard, conversations are listed as per social media in left hand side and then the each conversation messages can be seen when clicking conversations. user loggs into the using instagram and then is to be shown dashboard with all the metrics available. do a review a flow check"

The user then invoked the arena because they want a better answer than the first review (below in the baseline, if provided). They did not say what they disliked.

## Context

- Project directory (read-only for you): C:\Users\Acer\Documents\development\next-app
- Next.js 15 (app router) + React 19 + Tailwind 4 frontend, product name "Sanchar". Backend is a separate FastAPI service; `/api/v1/*` is proxied to it by `middleware.ts` (BACKEND_URL). Webhooks from Meta go to the backend directly.
- Stage: testing/development. The user cares about SEO later.
- Key files: middleware.ts, app/page.tsx, app/login/page.tsx, app/dashboard/page.tsx, app/layout.tsx, src/App.tsx (the inbox), src/api.ts, src/components/{Header,PageHeader,SidebarNav,InboxFeed,RightInspector,MetaSettingsModal,ProfileModal}.tsx, src/mockData.ts, app/api/**, Dockerfile, docker-compose.yml, public/.
- Intended flow: tenant logs in with Instagram (or links other channels) -> lands on a dashboard with all metrics -> conversations listed per social media -> clicking a conversation shows its messages.

## What is wanted

A code review plus flow check of this frontend against the intended flow: where the actual flow diverges from the intended one, real bugs, mock/dead code that misleads, and anything blocking the flow. Be specific (file:line), verify claims by reading the code (you may run `npx tsc --noEmit` only if it does not write outside .arena/), rank by severity, and say what to change. Do not modify the project. The backend source is not available; say when a finding depends on backend behaviour you cannot see.
