# Backend API contract

Base URL: the Apps Script Web App `/exec` URL (`VITE_API_BASE_URL`). Every request includes `?action=<name>`.

- **GET** requests: all fields (including `token`) go in the query string.
- **POST** requests: body is JSON, sent with `Content-Type: text/plain;charset=UTF-8` (required to avoid a CORS preflight Apps Script can't answer — see plan). `token` goes inside the JSON body.

Every response is `{ "success": true, "data": ... }` or `{ "success": false, "error": "<CODE>", "message": "..." }`.

Error codes: `INVALID_CREDENTIALS`, `SESSION_EXPIRED`, `NOT_FOUND`, `VALIDATION_ERROR`, `UNKNOWN_ACTION`, `SERVER_BUSY`, `SERVER_ERROR`.

## Actions

| action | method | auth | payload | data |
|---|---|---|---|---|
| `login` | POST | no | `{username, password}` | `{token, displayName, role, expiresAt}` |
| `logout` | POST | yes | `{token}` | `{}` |
| `me` | GET | yes | `{token}` | `{username, displayName, role}` |
| `changePassword` | POST | yes | `{token, oldPassword, newPassword}` | `{}` |
| `listProducts` | GET | yes | `{token, search?, category?}` | `{items: Product[], categories: string[]}` |
| `getProduct` | GET | yes | `{token, id}` | `Product` |
| `addProduct` | POST | yes | `{token, name, category?, description?, quantity?, value?, imageBase64?, imageMimeType?}` | `Product` |
| `updateProduct` | POST | yes | `{token, id, name?, category?, description?, quantity?, value?, imageBase64?, imageMimeType?}` | `Product` |
| `deleteProduct` | POST | yes | `{token, id}` | `{id}` (soft delete — sets status to `archived`) |
| `uploadImage` | POST | yes | `{token, productId, imageBase64, imageMimeType}` | `{imageId, imageUrl}` |

`Product`: `{id, name, category, description, quantity, value, imageId, imageUrl, status, createdAt, createdBy, updatedAt, updatedBy}`.

## Manual regression checklist (curl)

Replace `$URL` with the deployed `/exec` URL. Run after any backend change.

```sh
# 1. Login
curl -s -X POST "$URL?action=login" -H "Content-Type: text/plain" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
# -> copy the returned token into $TOKEN for the calls below

# 2. List products (should be empty items:[] on a fresh sheet)
curl -s "$URL?action=listProducts&token=$TOKEN"

# 3. Add a product (imageBase64 optional — omit for a quick text-only check)
curl -s -X POST "$URL?action=addProduct" -H "Content-Type: text/plain" \
  -d '{"token":"'"$TOKEN"'","name":"Test Widget","category":"Misc","quantity":5,"value":9.99}'
# -> copy the returned id into $ID

# 4. Get it back
curl -s "$URL?action=getProduct&token=$TOKEN&id=$ID"

# 5. Update it
curl -s -X POST "$URL?action=updateProduct" -H "Content-Type: text/plain" \
  -d '{"token":"'"$TOKEN"'","id":"'"$ID"'","quantity":3}'

# 6. Delete it (soft — check the sheet row now has status=archived)
curl -s -X POST "$URL?action=deleteProduct" -H "Content-Type: text/plain" \
  -d '{"token":"'"$TOKEN"'","id":"'"$ID"'"}'

# 7. Confirm it's gone from the active list
curl -s "$URL?action=listProducts&token=$TOKEN"

# 8. Bad token -> should return a clean JSON error, not an HTML page
curl -s "$URL?action=listProducts&token=garbage"

# 9. Logout
curl -s -X POST "$URL?action=logout" -H "Content-Type: text/plain" \
  -d '{"token":"'"$TOKEN"'"}'
```

Before wiring up React, also do a real-browser CORS check: a local HTML file with a `fetch()` call to `$URL` (from `file://` or `localhost`, a different origin than `script.google.com`) exercising both a GET and the `text/plain` POST shape above, checked in devtools. `curl` doesn't enforce CORS, so it can't catch this class of bug.

## Image upload flow

`imageBase64` is the raw base64 payload of the image file (no `data:image/...;base64,` prefix — strip that on the client before sending). `imageMimeType` is e.g. `image/jpeg`. Resize/compress client-side (~1600px wide, JPEG quality ~0.8) before base64-encoding to keep request size down.
