# Catalogue Admin Guide

## Adding Users

Users are stored in the Google Sheet, not created via the app. To add a new user:

1. **Generate credentials** — in Apps Script editor, open `Auth.gs` and run `hashPasswordForSeed('MyPassword123')` from the Run menu (▶️)
2. **Copy the output** — check Execution log for printed `salt:` and `passwordHash:` values
3. **Add to Users sheet** — paste a new row with:
   - `username`: (e.g., `sarah`)
   - `displayName`: (e.g., `Sarah Chen`)
   - `passwordHash`: (from step 2)
   - `salt`: (from step 2)
   - `role`: `admin` or `viewer` (currently not enforced; all users get full CRUD)
   - `active`: `true` or `false`
   - `createdAt`: today's date or ISO string
4. Done — they can now log in at the deployed URL.

> **Security note**: The password is hashed with SHA-256 + salt + pepper (pepper stored in Script Properties, never in the sheet). Don't reuse passwords; generate a unique one per user.

## Access Control & Rules

- **No row-level permissions** — all authenticated users see and can edit all products. If you need per-team data isolation, that requires backend changes.
- **Login lockout** — 5 failed attempts → 15-minute lockout per username (automatic, no admin action needed).
- **Session timeout** — 6 hours of inactivity. Users are logged out and must re-login.
- **Soft deletes** — deleted products stay in the sheet with `status: archived`. They never appear in the app. You can restore one by changing `status` back to `active` in the sheet.

## Data Entry Best Practices

**Manual sheet entry (preferred by design):**
- `id` — must be unique. Use numbers (e.g., `27001`), UUIDs, or any string with no spaces.
- `dfNumber` — optional. Give identical designs in different colours the same DF number (e.g., `102` for all colourways of "Peacock Blue"). Searching a DF number surfaces the whole family.
- `imageUrl` — accept any Drive link shape; the backend normalizes it. File must be shared as **"Anyone with the link"** or the app won't load it. Copy-paste links from Drive's "Copy link" button work as-is.
- `status` — leave blank or `active` for visible products. Use `archived` to hide without deleting.
- `quantity`, `value` — numbers. Leave blank for 0.

## Common Issues & Fixes

### Image not showing (broken-image icon or "No photo")

**Cause**: File not shared or URL is malformed.

**Fix**:
1. Open the Drive file → **Share** → check if it's shared with "Anyone with the link"
2. If not, share it now
3. Grab a fresh "Copy link" and paste into the sheet's `imageUrl` cell
4. Hard-refresh the app (Ctrl+Shift+R)

### "Product not found" when clicking a product

**Cause**: Numeric ID stored in sheet as a number; the app initially had a type-mismatch bug (now fixed in deployed version).

**Fix**:
1. Make sure `Auth.js` is deployed (you deployed it before Vercel, so this should be fine)
2. Hard-refresh the app
3. If still broken, check the product's `id` cell in the sheet — if it's a number with no quotes, retype it as `'27001` (leading apostrophe forces text format in Sheets)

### Login fails with "Too many attempts" after 5 tries

**Cause**: Account is locked for 15 minutes due to failed login rate limiting.

**Fix**: Wait 15 minutes, or:
1. Open Apps Script → run `CacheService.getScriptCache().remove('login_attempts_username')` (replace `username` with the locked username)
2. User can now try again immediately

### Changes to a product don't save / "Could not save product"

**Cause**: Apps Script backend hiccup (it fails ~1 in 3 requests, though the relay retries; if all retries fail you'll see this). Or the deployed code is out of sync with the frontend.

**Fix**:
1. Try again — the relay retries up to 5 times, so transient failures usually resolve
2. If it persists, check that the backend was deployed:
   - Apps Script → Deploy → Manage deployments
   - Confirm the deployment date is recent and shows your latest code

### Search isn't finding a product by name

**Cause**: Typo in the sheet, or the product is archived.

**Fix**:
1. Check the product name in the sheet — match capitalization and spacing exactly
2. Confirm `status` is blank or `active` (not `archived`)
3. Hard-refresh the app

### Two products with the same ID (accidental duplicate)

**Cause**: Copy-paste typo in the sheet.

**Fix**:
1. Find the duplicate row in the sheet
2. Change its `id` to a unique value
3. Both rows will now be editable/deletable separately

## Backups & Recovery

- **Sheet data** — Google Sheets auto-saves; no manual backup needed. But keep a CSV export in your team drive monthly as a safety net.
- **Drive photos** — all images stay in the folder you configured (`IMAGE_FOLDER_ID`). If you accidentally delete one, Google Drive's trash has it for 30 days.
- **Deleted products** — they're archived, not gone. Search the sheet for `status: archived` rows and change `status` back to `active` to restore.

## Performance Notes

The app reads the entire `Products` sheet on each load. This is instant (~1s) for up to ~500 products. Past that, latency degrades. If you outgrow this, the backend can move to server-side pagination without changing the frontend API.

## Getting Help

Check `docs/API.md` for the full action reference and a curl regression checklist if you suspect a backend issue.
