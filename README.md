# Internal Product/Asset Catalogue

React frontend + Google Apps Script backend (Google Sheets as the database, Google Drive for product photos). See [docs/API.md](docs/API.md) for the API contract and [.claude plan](.) for the full design rationale.

## One-time Google-side setup (do this yourself — needs your Google account)

1. **Create the Sheet**: a new Google Sheet with two tabs:
   - `Products` — header row: `id,name,category,description,quantity,value,imageId,imageUrl,status,createdAt,createdBy,updatedAt,updatedBy`
   - `Users` — header row: `username,passwordHash,salt,displayName,role,active,createdAt`
   - Copy the Sheet's ID from its URL (`.../d/<THIS_PART>/edit`).
2. **Create a Drive folder** for product images. Copy its folder ID from the URL.
3. **Create the Apps Script project**: either paste the contents of `backend/src/*.js` and `backend/appsscript.json` directly into a new project at script.google.com, or install `clasp` (`npm install -g @google/clasp`, `clasp login`) and run `clasp push` from `backend/` (update `backend/.clasp.json`'s `scriptId` first — create the script project once via the editor or `clasp create` and paste its ID in).
4. **Set Script Properties** (Project Settings → Script Properties, in the Apps Script editor): `SPREADSHEET_ID`, `IMAGE_FOLDER_ID`, `PASSWORD_PEPPER` (any long random string).
5. **Seed the first user**: follow `backend/tools/seed-admin.md`.
6. **Deploy as a Web App**: Deploy → New deployment → type "Web app" → execute as **Me** → who has access **Anyone** → Deploy. Copy the `/exec` URL.
   - For any future backend change, redeploy the **same** deployment (`clasp deploy -i <deploymentId>`, or via "Manage deployments" → edit → new version in the editor) — creating a brand-new deployment mints a new URL and breaks the frontend until it's updated.

## Frontend setup

```sh
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL to the /exec URL from step 6 above
npm run dev
```

Then deploy `frontend/` to Vercel (or Netlify): import the repo, set the root directory to `frontend`, and add `VITE_API_BASE_URL` as a project environment variable.

## Verifying it works

Follow the checklist in [docs/API.md](docs/API.md) — curl the backend directly first, then a quick real-browser CORS check, then the full add/edit/delete/image flow through the running frontend, before trusting the deployed setup.
