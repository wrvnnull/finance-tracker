/**
 * Code.gs — tempel ke Google Apps Script (Extensions > Apps Script di Google Sheet).
 * Deploy > New deployment > type: Web app.
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy URL ke config.js (APPS_SCRIPT_URL) dan set TOKEN di bawah ini.
 *
 * Kolom Transactions: id, date, type, account, category, amount, note, createdAt
 * Sheet Settings: key, value  (dipakai untuk budget per bulan: key = "budget_YYYY-MM")
 */
var CONFIG = {
  SHEET_NAME: 'Transactions',
  SETTINGS_NAME: 'Settings',
  TOKEN: 'GANTI_DENGAN_TOKEN_RAHASIA' // <- ganti, samakan di config.js
};

function doGet(e) { return handle(e); }
function doPost(e) { return handle(e); }

function getBody(e) {
  try {
    var c = e.postData ? e.postData.contents : '';
    var obj = c ? JSON.parse(c) : {};
    if (obj.payload) obj = JSON.parse(obj.payload);
    return obj;
  } catch (err) { return {}; }
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function handle(e) {
  try {
    var p = e.parameter || {};
    if (p.token !== CONFIG.TOKEN) return json({ error: 'unauthorized' }, 401);
    var action = p.action;
    var sheet = getSheet();

    if (action === 'list') return json({ data: readAll(sheet) });

    if (action === 'getBudget') {
      var m = p.month || todayISO().slice(0, 7);
      return json({ month: m, budget: Number(getSetting('budget_' + m)) || 0 });
    }
    if (action === 'setBudget') {
      var mb = p.month || todayISO().slice(0, 7);
      setSetting('budget_' + mb, Number(p.amount) || 0);
      return json({ month: mb, budget: Number(p.amount) || 0 });
    }

    var body = getBody(e);
    if (action === 'add') {
      var row = [
        body.id || String(Utilities.getUuid()),
        body.date || todayISO(),
        body.type || 'expense',
        body.account || 'Lainnya',
        body.category || 'Lainnya',
        Number(body.amount) || 0,
        body.note || '',
        new Date().toISOString()
      ];
      sheet.appendRow(row);
      return json({ success: true, row: row });
    }
    if (action === 'update') {
      var ok = updateById(sheet, p.id || body.id, body);
      return json({ success: true, updated: ok });
    }
    if (action === 'delete') {
      var del = deleteById(sheet, p.id || body.id);
      return json({ success: true, deleted: del });
    }
    return json({ error: 'unknown action: ' + action }, 400);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(['id', 'date', 'type', 'account', 'category', 'amount', 'note', 'createdAt']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.sort(2, false);
  }
  return sheet;
}

function getSettingsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SETTINGS_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SETTINGS_NAME);
    sheet.appendRow(['key', 'value']);
  }
  return sheet;
}

function readAll(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var v = sheet.getRange(2, 1, last - 1, 8).getValues();
  return v.map(function (r) {
    return { id: r[0], date: r[1], type: r[2], account: r[3], category: r[4], amount: r[5], note: r[6], createdAt: r[7] };
  });
}

function deleteById(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) { sheet.deleteRow(i + 2); return true; }
  }
  return false;
}

function updateById(sheet, id, data) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      var rn = i + 2;
      sheet.getRange(rn, 2, 1, 6).setValues([[
        data.date || todayISO(), data.type || 'expense', data.account || 'Lainnya',
        data.category || 'Lainnya', Number(data.amount) || 0, data.note || ''
      ]]);
      return true;
    }
  }
  return false;
}

function getSetting(key) {
  var s = getSettingsSheet();
  var last = s.getLastRow();
  if (last < 2) return '';
  var rows = s.getRange(2, 1, last - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) if (rows[i][0] === key) return rows[i][1];
  return '';
}

function setSetting(key, value) {
  var s = getSettingsSheet();
  var last = s.getLastRow();
  var rows = last >= 2 ? s.getRange(2, 1, last - 1, 2).getValues() : [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === key) { s.getRange(i + 2, 2, 1, 1).setValue(value); return; }
  }
  s.appendRow([key, value]);
}

function json(obj, code) {
  code = code || 200;
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
