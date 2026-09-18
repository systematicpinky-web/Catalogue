// Header-driven row <-> object mapping so handler code never depends on column order,
// plus the LockService wrapper every write path must use.

function getSheet_(tabName) {
  var ss = SpreadsheetApp.openById(getSpreadsheetId_());
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('Sheet tab not found: ' + tabName);
  return sheet;
}

function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

// Reads all data rows as an array of {header: value} objects, plus their 1-based sheet row numbers.
function readRows_(tabName) {
  var sheet = getSheet_(tabName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { sheet: sheet, headers: getHeaders_(sheet), rows: [] };

  var headers = getHeaders_(sheet);
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var rows = values.map(function (rowValues, i) {
    var obj = { __row: i + 2 };
    headers.forEach(function (h, idx) { obj[h] = rowValues[idx]; });
    return obj;
  });
  return { sheet: sheet, headers: headers, rows: rows };
}

// Appends one row, aligning object keys to the sheet's existing header order.
function appendRow_(tabName, obj) {
  var sheet = getSheet_(tabName);
  var headers = getHeaders_(sheet);
  var rowValues = headers.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(rowValues);
}

// Overwrites specific fields on an existing 1-based row number, by header name.
function updateRowFields_(tabName, rowNumber, fields) {
  var sheet = getSheet_(tabName);
  var headers = getHeaders_(sheet);
  Object.keys(fields).forEach(function (key) {
    var colIndex = headers.indexOf(key);
    if (colIndex === -1) throw new Error('Unknown column: ' + key + ' in ' + tabName);
    sheet.getRange(rowNumber, colIndex + 1).setValue(fields[key]);
  });
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('SERVER_BUSY');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
