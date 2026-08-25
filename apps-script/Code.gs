/**
 * Code.gs — tempel ke Google Apps Script (Extensions > Apps Script di Google Sheet).
 * Lalu Deploy > New deployment > type: Web app.
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy URL-nya ke config.js (APPS_SCRIPT_URL) dan set TOKEN di bawah ini.
 *
 * CATATAN KEAMANAN: "Anyone" berarti siapa saja yg punya URL bisa akses,
 * makanya wajib pakai TOKEN rahasia. Jangan commit token ke repo publik.
 * Untuk privasi lebih kuat, ubah "Who has access" ke akun Google kamu
 * (lalu app hanya jalan saat kamu login Google di perangkat tersebut).
 */
var CONFIG = {
  SHEET_NAME: 'Transactions',
  TOKEN: 'GANTI_DENGAN_TOKEN_RAHASIA' // <- ganti dengan string acak, samakan di config.js
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

function today() { return new Date().toISOString().slice(0, 10); }

function handle(e) {
  try {
    var p = e.parameter || {};
    if (p.token !== CONFIG.TOKEN) {
      return json({ error: 'unauthorized' }, 401);
    }
    var sheet = getSheet();
    var action = p.action;

    if (action === 'list') {
      return json({ data: readAll(sheet) });
    }

    var body = getBody(e);

    if (action === 'add') {
      var row = [
        body.id || String(Utilities.getUuid()),
        body.date || today(),
        body.type || 'expense',
        body.category || 'Lainnya',
        Number(body.amount) || 0,
        body.note || '',
        new Date().toISOString()
      ];
      sheet.appendRow(row);
      return json({ success: true, row: row });
    }

    if (action === 'update') {
      var id = p.id || body.id;
      var ok = updateById(sheet, id, body);
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
    sheet.appendRow(['id', 'date', 'type', 'category', 'amount', 'note', 'createdAt']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    sheet.sort(2, false); // tanggal terbaru di atas
  }
  return sheet;
}

function readAll(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var values = sheet.getRange(2, 1, last - 1, 7).getValues();
  return values.map(function (r) {
    return {
      id: r[0], date: r[1], type: r[2], category: r[3],
      amount: r[4], note: r[5], createdAt: r[6]
    };
  });
}

function deleteById(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

function updateById(sheet, id, data) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      var rowNum = i + 2;
      sheet.getRange(rowNum, 2, 1, 5).setValues([[
        data.date || today(),
        data.type || 'expense',
        data.category || 'Lainnya',
        Number(data.amount) || 0,
        data.note || ''
      ]]);
      return true;
    }
  }
  return false;
}

function json(obj, code) {
  code = code || 200;
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
