# Hail Detect Web

AI-powered hail damage inspection demo for insurance and auto-body clients.

## Overview

Hail Detect Web lets a user upload a vehicle photo and receive polygon-level dent annotations in seconds. The image is forwarded through a server-side proxy to a Mask R-CNN model running on Google Cloud Run; the results are rendered as a canvas overlay with a per-detection confidence list. This is the web sibling of the Flutter mobile app at `C:\repositories\hail_app` — both clients send images to the same Cloud Run backend. No accounts are required. Inspection history is stored entirely in the browser via IndexedDB; clearing browser data removes it.

## Tech Stack

- **Next.js 16** App Router, TypeScript strict mode
- **Tailwind CSS v4** + **shadcn/ui** (base-nova style)
- **idb** — typed IndexedDB wrapper for local inspection history
- **lucide-react** — icons
- **sonner** — toast notifications
- **Vitest** + **fake-indexeddb** + **jsdom** — test suite

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # then set CLOUD_RUN_URL — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `CLOUD_RUN_URL` | Base URL of the Cloud Run detection service, no trailing slash. Obtain from the project owner or your Cloud Run console. **Never commit this value.** |

Copy `.env.local.example` to `.env.local` and fill in `CLOUD_RUN_URL`. The file is listed in `.gitignore` and must not be committed.

## Project Structure

```
src/
  app/
    layout.tsx                   Root layout: Geist font, Toaster, PageShell, InspectionProvider
    page.tsx                     Landing page: hero, DropZone, how-it-works section
    results/[id]/page.tsx        Results view: overlay canvas + detection list + summary bar
    history/page.tsx             Inspection history grid loaded from IndexedDB
    api/detect/route.ts          Server-side proxy to Cloud Run (22 MB cap, 125 s timeout)
  components/
    upload/DropZone.tsx          Drag-and-drop / click-to-select file input with preview
    results/OverlayCanvas.tsx    Canvas element that renders the detection overlay
    results/DetectionList.tsx    Sidebar list of detections with confidence badges
    results/SummaryBar.tsx       Summary row: dent count, average confidence, image dimensions
    history/InspectionCard.tsx   Single card in the history grid with thumbnail and metadata
    history/InspectionGrid.tsx   Grid that loads all inspections from IndexedDB on mount
    layout/PageShell.tsx         Sticky navigation bar and footer wrapper
  lib/
    api.ts                       detectDents() — posts to /api/detect, parses response
    db.ts                        IndexedDB wrapper (hail_web v1, inspections store)
    overlay.ts                   drawOverlay() — renders polygon masks + boxes + labels on canvas
    thumbnail.ts                 generateThumbnail() — downscales canvas or Blob to 200 px wide JPEG
    types.ts                     Shared TypeScript interfaces: Detection, DetectionResult, Inspection
  context/
    InspectionContext.tsx        useReducer state machine (idle | uploading | loading | done | error)
tests/
  setup.ts                       Vitest global setup (fake-indexeddb, canvas mock)
  *.test.ts                      Unit tests for lib/, context/, and api/detect/route.ts
```

## How the Demo Flow Works

1. User opens the landing page and drops or selects a JPEG or PNG (up to 20 MB).
2. The client POSTs the file to `/api/detect` (the internal Next.js proxy route).
3. The proxy forwards the request to `CLOUD_RUN_URL/detect` as `multipart/form-data` with a 125-second timeout, keeping the backend URL server-side.
4. Cloud Run runs Mask R-CNN inference and returns JSON containing bounding boxes and polygon contours for each detection.
5. `overlay.ts` renders the polygons, boxes, and confidence labels onto a canvas element in the browser.
6. The original image, overlay image, and a 200-px thumbnail are saved to IndexedDB and the user is navigated to `/results/[id]`.
7. Past inspections are available at `/history` as a card grid, loaded directly from IndexedDB.

## Architecture Notes

### Inference Proxy

`src/app/api/detect/route.ts` keeps `CLOUD_RUN_URL` server-side so it is never exposed to the browser. It enforces a 22 MB body limit before parsing `FormData`, aborts the upstream fetch after 125 seconds, and truncates upstream error bodies to 200 characters before forwarding them. The `content-type` header is intentionally not forwarded — undici re-serializes `FormData` with a fresh multipart boundary, and forwarding the original boundary would corrupt the request.

### Storage

All inspection data is persisted to IndexedDB via `idb` in a single `inspections` object store keyed by UUID. Images are stored as `Blob` objects, not base64 strings, to keep memory and storage overhead low. The DB is opened lazily on first use and the promise is cached for the lifetime of the page.

### Overlay Rendering

Detection masks are returned by the backend as polygon contour coordinates (not PNG bitmaps). `overlay.ts` renders them directly with the Canvas 2D API — dents in red, false positives in amber — overlaid on the original image at full resolution.

### State Management

`InspectionContext.tsx` uses a plain `useReducer` with a discriminated-union state type (`idle | uploading | loading | done | error`). There are no global state libraries. The reducer is exported for direct unit testing.

## Scripts

| Script | Command | Description |
|---|---|---|
| dev | `npm run dev` | Start Next.js development server with fast refresh |
| build | `npm run build` | Production build with type checking and static analysis |
| start | `npm run start` | Serve a production build locally |
| lint | `npm run lint` | Run Next.js ESLint rules |
| test | `npm run test` | Run the full Vitest suite once |
| test:watch | `npm run test:watch` | Run Vitest in interactive watch mode |

## Testing

```bash
npm run test
```

86 tests via Vitest running in jsdom. Coverage includes:

- **IDB layer** — `saveInspection`, `listInspections`, `getInspection`, `deleteInspection` via `fake-indexeddb`
- **Overlay** — `drawOverlay` polygon and label rendering via a canvas mock
- **Proxy route** — `POST /api/detect` request forwarding, timeout handling, and error truncation via fetch stub
- **State machine** — `reducer` transitions for all action types
- **API client** — `detectDents` form construction and response parsing

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In the project settings under **Environment Variables**, add `CLOUD_RUN_URL` with the Cloud Run endpoint URL.
4. Deploy. Vercel auto-detects Next.js — no additional configuration is needed. The free tier is sufficient for demo use.

## Related Projects

- **`C:\repositories\hail_app`** — Flutter mobile app; uses the same Cloud Run Mask R-CNN endpoint for photo capture inference.
- **`C:\repositories\Hail`** — Python training and inference pipeline; source of the Mask R-CNN model deployed to Cloud Run.

## License

No license file is present in this repository. All rights reserved until a license is added.
