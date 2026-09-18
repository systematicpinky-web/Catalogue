// Login/session/password-hashing. requireSession_() is the actual access-control boundary
// for every action, since the Web App deployment itself ("Anyone" access) enforces none.

function hashPassword_(password, salt) {
  var pepper = getPasswordPepper_();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt + pepper);
  return bytes.map(function (b) {
    return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0');
  }).join('');
}

// Run manually from the Apps Script editor to generate the first admin's row values.
// Paste the printed hash+salt into row 2 of the Users sheet by hand.
function hashPasswordForSeed(password) {
  var salt = Utilities.getUuid();
  var hash = hashPassword_(password, salt);
  Logger.log('salt: ' + salt);
  Logger.log('passwordHash: ' + hash);
  return { salt: salt, passwordHash: hash };
}

function findUserByUsername_(username) {
  var normalized = String(username || '').toLowerCase();
  var data = readRows_(SHEET_USERS);
  for (var i = 0; i < data.rows.length; i++) {
    if (String(data.rows[i].username || '').toLowerCase() === normalized) return data.rows[i];
  }
  return null;
}

function login_(payload) {
  var user = findUserByUsername_(payload.username);
  if (!user || user.active === false) throw new ApiError_('INVALID_CREDENTIALS', 'Invalid username or password');

  var hash = hashPassword_(payload.password, user.salt);
  if (hash !== user.passwordHash) throw new ApiError_('INVALID_CREDENTIALS', 'Invalid username or password');

  var token = Utilities.getUuid();
  var session = { username: user.username, role: user.role, displayName: user.displayName };
  CacheService.getScriptCache().put(token, JSON.stringify(session), SESSION_TTL_SECONDS);

  return {
    token: token,
    displayName: user.displayName,
    role: user.role,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
  };
}

function logout_(payload) {
  CacheService.getScriptCache().remove(payload.token);
  return {};
}

// Returns the session object for a valid token, or throws SESSION_EXPIRED.
function requireSession_(token) {
  if (!token) throw new ApiError_('SESSION_EXPIRED', 'Missing session token');
  var cache = CacheService.getScriptCache();
  var raw = cache.get(token);
  if (!raw) throw new ApiError_('SESSION_EXPIRED', 'Session expired, please log in again');

  cache.put(token, raw, SESSION_TTL_SECONDS); // slide expiry forward on activity
  return JSON.parse(raw);
}

function me_(payload) {
  var session = requireSession_(payload.token);
  return { username: session.username, displayName: session.displayName, role: session.role };
}

function changePassword_(payload) {
  var session = requireSession_(payload.token);
  var data = readRows_(SHEET_USERS);
  var userRow = data.rows.filter(function (r) {
    return String(r.username).toLowerCase() === session.username.toLowerCase();
  })[0];
  if (!userRow) throw new ApiError_('NOT_FOUND', 'User not found');

  var currentHash = hashPassword_(payload.oldPassword, userRow.salt);
  if (currentHash !== userRow.passwordHash) throw new ApiError_('INVALID_CREDENTIALS', 'Current password is incorrect');

  var newSalt = Utilities.getUuid();
  var newHash = hashPassword_(payload.newPassword, newSalt);
  withLock_(function () {
    updateRowFields_(SHEET_USERS, userRow.__row, { salt: newSalt, passwordHash: newHash });
  });
  return {};
}
