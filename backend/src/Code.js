// Single entry point. Every response is JSON, even on error — a global try/catch guarantees
// this, since an uncaught exception would otherwise make Apps Script return an HTML error page
// and break res.json() on the frontend.

function ApiError_(code, message) {
  this.code = code;
  this.message = message;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return jsonResponse_({ success: true, data: data });
}

function fail_(code, message) {
  return jsonResponse_({ success: false, error: code, message: message });
}

// Actions that don't require an existing session.
var PUBLIC_ACTIONS = { login: true };

var ROUTES = {
  login: function (payload) { return login_(payload); },
  logout: function (payload) { return logout_(payload); },
  me: function (payload) { return me_(payload); },
  changePassword: function (payload) { return changePassword_(payload); },
  listProducts: function (payload, session) { return listProducts_(session, payload); },
  getProduct: function (payload, session) { return getProduct_(session, payload); },
  addProduct: function (payload, session) { return addProduct_(session, payload); },
  updateProduct: function (payload, session) { return updateProduct_(session, payload); },
  deleteProduct: function (payload, session) { return deleteProduct_(session, payload); },
  uploadImage: function (payload, session) { return uploadImage_(session, payload); }
};

function doGet(e) {
  return handle_(e, false);
}

function doPost(e) {
  return handle_(e, true);
}

function handle_(e, isPost) {
  try {
    var params = e.parameter || {};
    var payload = params;
    if (isPost && e.postData && e.postData.contents) {
      // text/plain POST bodies are NOT parsed into e.parameter by Apps Script — read raw JSON manually.
      payload = JSON.parse(e.postData.contents);
    }

    var action = params.action;
    var fn = ROUTES[action];
    if (!fn) return fail_('UNKNOWN_ACTION', 'No such action: ' + action);

    var session = null;
    if (!PUBLIC_ACTIONS[action]) {
      session = requireSession_(payload.token);
    }

    var data = fn(payload, session);
    return ok_(data);
  } catch (err) {
    if (err instanceof ApiError_) return fail_(err.code, err.message);
    return fail_('SERVER_ERROR', err.message);
  }
}
