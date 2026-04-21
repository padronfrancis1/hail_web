# Hail Detect — Client Demo Web App

AI-powered hail damage detection for vehicle panels. Upload a JPEG/PNG photo and get instant polygon-level dent annotations powered by a Mask R-CNN model running on Google Cloud Run.

This is the web sibling of the Flutter mobile app at `C:\repositories\hail_app`, built for insurance and auto-body prospect demos.

## Stack

- **Next.js 16 App Router** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (base-nova style)
- **idb** — IndexedDB for local inspection history
- **lucide-react** — icons
- **sonner** — toast notifications
- Cloud Run API at `CLOUD_RUN_URL/detect` (Mask R-CNN backend)

## Setup

```bash
cd C:\repositories\hail_web
npm install
cp .env.local.example .env.local
# Edit .env.local and set CLOUD_RUN_URL if using a different endpoint
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `CLOUD_RUN_URL` | Base URL of the Cloud Run detection service (no trailing slash) |

Copy `.env.local.example` to `.env.local` and fill in the values. Never commit `.env.local`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Under **Environment Variables**, add `CLOUD_RUN_URL` with the value `https://hail-detect-338479771343.us-east4.run.app`.
4. Deploy. Vercel auto-detects Next.js — no extra configuration needed.

## Project Structure

```
src/
  app/
    layout.tsx                  Root layout: Geist font, Toaster, PageShell, InspectionProvider
    page.tsx                    Landing page: hero + DropZone + How it works
    results/[id]/page.tsx       Results view: overlay canvas + detection list
    history/page.tsx            Grid of past inspections (IndexedDB)
    api/detect/route.ts         Proxy to Cloud Run (adds 125s timeout)
  components/
    upload/DropZone.tsx         Drag-drop upload with preview
    results/OverlayCanvas.tsx   Canvas rendering of detection overlay
    results/DetectionList.tsx   Sidebar list of detections with confidence badges
    results/SummaryBar.tsx      Summary: dent count, avg confidence, dimensions
    history/InspectionCard.tsx  History grid card with thumbnail
    history/InspectionGrid.tsx  Grid loader from IndexedDB
    layout/PageShell.tsx        Sticky nav + footer
  lib/
    api.ts          detectDents(file, opts) -> DetectionResult
    db.ts           IndexedDB wrapper (hail_web, v1, inspections store)
    overlay.ts      drawOverlay(canvas, img, detections) — polygon + box + label
    thumbnail.ts    generateThumbnail(canvas|blob) -> Blob (200px wide)
    types.ts        Detection, DetectionResult, Inspection
  context/
    InspectionContext.tsx   useReducer state machine: idle | uploading | loading | done | error
```

## How Inference Works

1. User drops or selects a JPEG/PNG (max 20 MB).
2. Client POSTs to `/api/detect` (Next.js proxy route).
3. Proxy forwards to `CLOUD_RUN_URL/detect` as `multipart/form-data` with a 125 s timeout.
4. Response JSON contains bounding boxes and polygon contours.
5. `overlay.ts` renders polygons + boxes + labels onto a canvas element.
6. The overlay PNG + thumbnail are saved to IndexedDB for the history view.

## Local Storage

All inspections are stored client-side in IndexedDB (`hail_web` database, `inspections` store). No server-side persistence — clearing browser data removes history.
