# Catalogue

Internal product/asset catalogue for a small team. React frontend on Vercel, Google Apps Script + Google Sheets as the backend, Google Drive for photos.

## Architecture

```
Browser ──▶ /api/gas    (serverless relay, retries + 30s read cache) ──▶ Apps Script ──▶ Sheet
        └─▶ /api/image  (serverless image proxy, CDN-cached)         ──▶ Drive
```

Everything goes through the two serverless functions rather than calling Google directly. That isn't incidental — it works around two measured problems:

- **Apps Script fails intermittently.** Its `/exec` endpoint returns a 404 or HTML error page for roughly 1 in 3 requests. The relay retries up to 5 times, which puts user-visible failure odds under 1%.
- **Browsers can't POST to Apps Script cross-origin.** Apps Script serves `doPost` responses via a redirect, and browsers downgrade a POST to GET when following it, breaking the response. Server-to-server that problem doesn't exist.
- **Drive rate-limits image hotlinking.** Fetching images server-side once and caching them means Google sees one request per image instead of one per viewer.

## One-time Google setup

1. **Sheet** with two tabs:
   - `Products` — headers: `id, name, category, description, quantity, value, imageId, imageUrl, status, createdAt, createdBy, updatedAt, updatedBy`
   - `Users` — headers: `username, passwordHash, salt, displayName, role, active, createdAt`
2. **Drive folder** for product images.
3. **Apps Script project**: paste the contents of `backend/src/*.js` into a new project at script.google.com (one file each), and replace `appsscript.json` with `backend/appsscript.json`.
4. **Script Properties** (Project Settings): `SPREADSHEET_ID`, `IMAGE_FOLDER_ID`, `PASSWORD_PEPPER` (any long random string).
5. **Seed the first user**: see `backend/tools/seed-admin.md`.
6. **Deploy → New deployment → Web app**, execute as **Me**, access **Anyone**. Copy the `/exec` URL.

> After any backend change, redeploy the **same** deployment (Manage deployments → edit → New version). Creating a new deployment mints a new URL and breaks the frontend.

## Running locally

```sh
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL to the /exec URL
npm run dev
```

The Vite dev server mirrors both serverless functions as middleware, so local dev exercises the same code paths as production.

## Deploying

Import the repo on Vercel with **root directory `frontend`**, and set `VITE_API_BASE_URL` as a project environment variable. `vercel.json` handles the SPA fallback and keeps it clear of `/api`.

## Adding products

Either through the app's **Add product** form (handles image upload automatically), or by adding rows directly to the `Products` sheet. For manual rows:

- **`id`** must be filled and unique (any value — numeric ids work).
- **`imageUrl`** accepts any Drive link shape, including the `/file/d/ID/view` one from "Copy link"; the backend normalizes it. The file must be shared as **"Anyone with the link"**.
- **`status`** anything other than `archived` is treated as visible.

## Scaling notes

Sheets-as-a-database reads every row on each request. That's fine into the low thousands of products; past that, `listProducts` should move to server-side pagination (the action already accepts `search`/`category`) or the data should move to a real database. The API contract is stable enough that either change stays behind `frontend/src/api/`.

See [docs/API.md](docs/API.md) for the action contract and a curl regression checklist.
