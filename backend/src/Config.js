// Tab names and Script Properties accessors — the only place these names/keys are spelled out.

var SHEET_PRODUCTS = 'Products';
var SHEET_USERS = 'Users';

var SESSION_TTL_SECONDS = 6 * 60 * 60; // CacheService ceiling

function getScriptProp_(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error('Missing Script Property: ' + key);
  return value;
}

function getSpreadsheetId_() {
  return getScriptProp_('SPREADSHEET_ID');
}

function getImageFolderId_() {
  return getScriptProp_('IMAGE_FOLDER_ID');
}

function getPasswordPepper_() {
  return getScriptProp_('PASSWORD_PEPPER');
}
