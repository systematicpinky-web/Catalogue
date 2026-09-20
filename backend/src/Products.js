// Product CRUD. Every handler here is reached only after requireSession_() in Code.js.

// Rows added directly in the Sheet (rather than through the app's upload flow) tend to have
// whatever link Drive's "Copy link" button produced (.../file/d/ID/view?...), which is a viewer
// PAGE, not a raw image URL, so it won't render in an <img> tag. Pull the file ID out of any
// common Drive URL shape (or accept a bare ID) and rebuild it as the embeddable thumbnail URL.
function normalizeImageUrl_(raw) {
  var value = String(raw || '').trim();
  if (!value) return '';

  var idMatch = value.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/) || value.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  var id = idMatch ? idMatch[1] : (/^[a-zA-Z0-9_-]{10,}$/.test(value) ? value : null);

  if (!id) return value; // not a recognizable Drive link/ID - leave as-is (e.g. some other host)
  return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000';
}

// Ids arrive from the URL/query as strings, but a row id typed straight into the Sheet
// comes back as a number (Sheets stores 27001 numerically). Compare loosely so manually
// entered rows can be opened, edited and deleted like app-created (UUID) ones.
function sameId_(a, b) {
  return String(a) === String(b);
}

// readRows_(SHEET_PRODUCTS) does a full getRange().getValues() scan, which is the single
// slowest thing in this backend and only grows with the catalogue. CacheService is shared
// across every execution of the script (unlike the Vercel relay's per-instance cache), so a
// short TTL here cuts most listProducts_/getProduct_ calls down to a cache hit instead of a
// sheet read. Every write clears it, so it's never more than PRODUCTS_CACHE_TTL_SECONDS stale.
var PRODUCTS_CACHE_KEY = 'products_rows_v1';
var PRODUCTS_CACHE_TTL_SECONDS = 30;

function getProductRows_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(PRODUCTS_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  var data = readRows_(SHEET_PRODUCTS);
  try {
    // CacheService values are capped at 100KB; a huge catalogue could exceed that, in which
    // case this just no-ops and every call falls back to a fresh sheet read.
    cache.put(PRODUCTS_CACHE_KEY, JSON.stringify(data.rows), PRODUCTS_CACHE_TTL_SECONDS);
  } catch (err) {
    // oversized or transient cache failure - reads still work, just uncached
  }
  return data.rows;
}

function invalidateProductRowsCache_() {
  CacheService.getScriptCache().remove(PRODUCTS_CACHE_KEY);
}

function toProduct_(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    quantity: row.quantity,
    value: row.value,
    dfNumber: row.dfNumber,
    imageId: row.imageId,
    imageUrl: normalizeImageUrl_(row.imageUrl),
    status: row.status,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy
  };
}

// The grid/list view never needs description, imageId, status, or the audit trail fields -
// trimming them out shrinks both the JSON Apps Script builds and what crosses the wire on
// every list load. Full detail still comes from toProduct_ via getProduct_.
function toProductSummary_(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    value: row.value,
    dfNumber: row.dfNumber,
    imageUrl: normalizeImageUrl_(row.imageUrl),
    createdAt: row.createdAt
  };
}

function listProducts_(session, payload) {
  var rows = getProductRows_();
  var active = rows.filter(function (r) { return r.status !== 'archived'; });

  var search = String(payload.search || '').toLowerCase().trim();
  var category = String(payload.category || '').trim();

  // A DF (design family) number groups colourways of the same design. Matching it here
  // means typing a DF number into the same search box surfaces every colour in that family.
  var filtered = active.filter(function (r) {
    if (search) {
      var matchesName = String(r.name || '').toLowerCase().indexOf(search) !== -1;
      var matchesDf = String(r.dfNumber || '').toLowerCase().indexOf(search) !== -1;
      if (!matchesName && !matchesDf) return false;
    }
    if (category && r.category !== category) return false;
    return true;
  });

  var categories = Array.from(new Set(active.map(function (r) { return r.category; }).filter(Boolean)));

  return {
    items: filtered.map(toProductSummary_),
    categories: categories
  };
}

function getProduct_(session, payload) {
  var rows = getProductRows_();
  var row = rows.filter(function (r) { return sameId_(r.id, payload.id); })[0];
  if (!row) throw new ApiError_('NOT_FOUND', 'Product not found');
  return toProduct_(row);
}

function requireField_(payload, field) {
  if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
    throw new ApiError_('VALIDATION_ERROR', 'Missing required field: ' + field);
  }
}

function addProduct_(session, payload) {
  requireField_(payload, 'name');

  return withLock_(function () {
    var id = Utilities.getUuid();
    var now = new Date().toISOString();
    var image = { imageId: '', imageUrl: '' };
    if (payload.imageBase64) {
      image = saveImage_(id, payload.imageBase64, payload.imageMimeType || 'image/jpeg');
    }

    var row = {
      id: id,
      name: payload.name,
      category: payload.category || '',
      description: payload.description || '',
      quantity: payload.quantity || 0,
      value: payload.value || 0,
      dfNumber: payload.dfNumber || '',
      imageId: image.imageId,
      imageUrl: image.imageUrl,
      status: 'active',
      createdAt: now,
      createdBy: session.username,
      updatedAt: now,
      updatedBy: session.username
    };
    appendRow_(SHEET_PRODUCTS, row);
    invalidateProductRowsCache_();
    return toProduct_(row);
  });
}

function updateProduct_(session, payload) {
  requireField_(payload, 'id');

  return withLock_(function () {
    var data = readRows_(SHEET_PRODUCTS);
    var existing = data.rows.filter(function (r) { return sameId_(r.id, payload.id); })[0];
    if (!existing) throw new ApiError_('NOT_FOUND', 'Product not found');

    var fields = {
      updatedAt: new Date().toISOString(),
      updatedBy: session.username
    };
    ['name', 'category', 'description', 'quantity', 'value', 'dfNumber'].forEach(function (key) {
      if (payload[key] !== undefined) fields[key] = payload[key];
    });

    if (payload.imageBase64) {
      deleteImageIfPresent_(existing.imageId);
      var image = saveImage_(existing.id, payload.imageBase64, payload.imageMimeType || 'image/jpeg');
      fields.imageId = image.imageId;
      fields.imageUrl = image.imageUrl;
    }

    updateRowFields_(SHEET_PRODUCTS, existing.__row, fields);
    invalidateProductRowsCache_();
    return getProduct_(session, { id: payload.id });
  });
}

function deleteProduct_(session, payload) {
  requireField_(payload, 'id');

  return withLock_(function () {
    var data = readRows_(SHEET_PRODUCTS);
    var existing = data.rows.filter(function (r) { return sameId_(r.id, payload.id); })[0];
    if (!existing) throw new ApiError_('NOT_FOUND', 'Product not found');

    updateRowFields_(SHEET_PRODUCTS, existing.__row, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
      updatedBy: session.username
    });
    invalidateProductRowsCache_();
    return { id: payload.id };
  });
}

function uploadImage_(session, payload) {
  requireField_(payload, 'productId');
  requireField_(payload, 'imageBase64');

  return withLock_(function () {
    var data = readRows_(SHEET_PRODUCTS);
    var existing = data.rows.filter(function (r) { return sameId_(r.id, payload.productId); })[0];
    if (!existing) throw new ApiError_('NOT_FOUND', 'Product not found');

    deleteImageIfPresent_(existing.imageId);
    var image = saveImage_(existing.id, payload.imageBase64, payload.imageMimeType || 'image/jpeg');

    updateRowFields_(SHEET_PRODUCTS, existing.__row, {
      imageId: image.imageId,
      imageUrl: image.imageUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: session.username
    });
    invalidateProductRowsCache_();
    return image;
  });
}
