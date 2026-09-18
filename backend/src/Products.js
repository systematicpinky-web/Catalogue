// Product CRUD. Every handler here is reached only after requireSession_() in Code.js.

function toProduct_(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    quantity: row.quantity,
    value: row.value,
    imageId: row.imageId,
    imageUrl: row.imageUrl,
    status: row.status,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy
  };
}

function listProducts_(session, payload) {
  var data = readRows_(SHEET_PRODUCTS);
  var active = data.rows.filter(function (r) { return r.status !== 'archived'; });

  var search = String(payload.search || '').toLowerCase().trim();
  var category = String(payload.category || '').trim();

  var filtered = active.filter(function (r) {
    if (search && String(r.name || '').toLowerCase().indexOf(search) === -1) return false;
    if (category && r.category !== category) return false;
    return true;
  });

  var categories = Array.from(new Set(active.map(function (r) { return r.category; }).filter(Boolean)));

  return {
    items: filtered.map(toProduct_),
    categories: categories
  };
}

function getProduct_(session, payload) {
  var data = readRows_(SHEET_PRODUCTS);
  var row = data.rows.filter(function (r) { return r.id === payload.id; })[0];
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
      imageId: image.imageId,
      imageUrl: image.imageUrl,
      status: 'active',
      createdAt: now,
      createdBy: session.username,
      updatedAt: now,
      updatedBy: session.username
    };
    appendRow_(SHEET_PRODUCTS, row);
    return toProduct_(row);
  });
}

function updateProduct_(session, payload) {
  requireField_(payload, 'id');

  return withLock_(function () {
    var data = readRows_(SHEET_PRODUCTS);
    var existing = data.rows.filter(function (r) { return r.id === payload.id; })[0];
    if (!existing) throw new ApiError_('NOT_FOUND', 'Product not found');

    var fields = {
      updatedAt: new Date().toISOString(),
      updatedBy: session.username
    };
    ['name', 'category', 'description', 'quantity', 'value'].forEach(function (key) {
      if (payload[key] !== undefined) fields[key] = payload[key];
    });

    if (payload.imageBase64) {
      deleteImageIfPresent_(existing.imageId);
      var image = saveImage_(existing.id, payload.imageBase64, payload.imageMimeType || 'image/jpeg');
      fields.imageId = image.imageId;
      fields.imageUrl = image.imageUrl;
    }

    updateRowFields_(SHEET_PRODUCTS, existing.__row, fields);
    return getProduct_(session, { id: payload.id });
  });
}

function deleteProduct_(session, payload) {
  requireField_(payload, 'id');

  return withLock_(function () {
    var data = readRows_(SHEET_PRODUCTS);
    var existing = data.rows.filter(function (r) { return r.id === payload.id; })[0];
    if (!existing) throw new ApiError_('NOT_FOUND', 'Product not found');

    updateRowFields_(SHEET_PRODUCTS, existing.__row, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
      updatedBy: session.username
    });
    return { id: payload.id };
  });
}

function uploadImage_(session, payload) {
  requireField_(payload, 'productId');
  requireField_(payload, 'imageBase64');

  return withLock_(function () {
    var data = readRows_(SHEET_PRODUCTS);
    var existing = data.rows.filter(function (r) { return r.id === payload.productId; })[0];
    if (!existing) throw new ApiError_('NOT_FOUND', 'Product not found');

    deleteImageIfPresent_(existing.imageId);
    var image = saveImage_(existing.id, payload.imageBase64, payload.imageMimeType || 'image/jpeg');

    updateRowFields_(SHEET_PRODUCTS, existing.__row, {
      imageId: image.imageId,
      imageUrl: image.imageUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: session.username
    });
    return image;
  });
}
