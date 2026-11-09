# Vegabot frontend

Simplified demo client for building and testing AI chatbots.

## Tech stack

- Vite + React 19 + JavaScript
- Tailwind CSS v4 (CSS-first tokens) + shadcn-style UI primitives
- Redux Toolkit + RTK Query (auth is live; chatbot/chat endpoints are mocked for now)

## Pages

| Route | Description |
| --- | --- |
| `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` | Auth pages (backend connected) |
| `/` | **Chatbot list** — searchable, paginated grid of all chatbots |
| `/chatbot/:slug` | **Chat details** — split view: setup panel (left) + live chat (right) |

### Chat details page

- **Left — Configuration tab:** name, photo, description, welcome message, tone, response length.
- **Left — Knowledge tab:**
  - *Base Knowledge:* add URLs or upload/drag-drop files (training is simulated).
  - *Products:* download an `.xlsx` template, fill it in and upload — rows are parsed client-side into the catalog.
  - *Services:* add one-by-one via a dialog or bulk import from the spreadsheet template.
- **Right — Chat panel:**
  - *Text mode:* markdown bot replies (simulated engine in `src/mocks/chat.js`).
  - *Voice mode:* live-call interface with animated orb, timer, live captions and mute/end-call controls.

## Mock layer

All chatbot/knowledge/chat data lives in memory (`src/mocks/`) — the backend and
the realtime voice/text socket (`/ws/dashboard/?token=<JWT>`) will be connected
later. Each mock helper maps roughly 1:1 to a future RTK Query endpoint.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # eslint
npm run preview  # preview production build
```
