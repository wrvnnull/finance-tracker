/* app.js — UI + storage (Sheet/localStorage) + PWA + akun + recurring + PDF */
(function () {
  'use strict';
  var cfg = window.APP_CONFIG || {};
  var FC = window.FinanceCore;
  var useSheet = !!(cfg.APPS_SCRIPT_URL && (cfg.TOKEN || cfg.USE_PROXY));
  var ACCOUNTS = cfg.ACCOUNTS || ['Dompet', 'Bank', 'Lainnya'];
  var CATS = Object.keys(FC.CATEGORY_ICONS);
  var COLORS = ['#0d9488', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316'];

  function catColor(c) { var i = CATS.indexOf(c); return COLORS[(i < 0 ? CATS.length - 1 : i) % COLORS.length]; }
  function withToken(p) { if (!cfg.USE_PROXY && cfg.TOKEN) p.token = cfg.TOKEN; return p; }
  function qstr(p) { return Object.keys(p).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&'); }

  var Storage = {
    list: function () {
      if (useSheet) return fetch(cfg.APPS_SCRIPT_URL + '?' + qstr(withToken({ action: 'list' }))).then(function (r) { return r.json(); }).then(function (d) { if (d.error) throw new Error(d.error); return d.data || []; });
      return Promise.resolve(JSON.parse(localStorage.getItem('fin_tx') || '[]'));
    },
    add: function (tx) {
      if (useSheet) {
        var fd = new URLSearchParams(); fd.set('action', 'add');
        if (!cfg.USE_PROXY && cfg.TOKEN) fd.set('token', cfg.TOKEN);
        fd.set('payload', JSON.stringify(tx));
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function (d) { if (d.error) throw new Error(d.error); return tx; });
      }
      var all = JSON.parse(localStorage.getItem('fin_tx') || '[]'); all.push(tx); localStorage.setItem('fin_tx', JSON.stringify(all)); return Promise.resolve(tx);
    },
    update: function (tx) {
      if (useSheet) {
        var fd = new URLSearchParams(); fd.set('action', 'update');
        if (!cfg.USE_PROXY && cfg.TOKEN) fd.set('token', cfg.TOKEN);
        fd.set('id', tx.id); fd.set('payload', JSON.stringify(tx));
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function (d) { if (d.error) throw new Error(d.error); return tx; });
      }
      var all = FC.replaceById(JSON.parse(localStorage.getItem('fin_tx') || '[]'), tx); localStorage.setItem('fin_tx', JSON.stringify(all)); return Promise.resolve(tx);
    },
    remove: function (id) {
      if (useSheet) {
        var fd = new URLSearchParams(); fd.set('action', 'delete');
        if (!cfg.USE_PROXY && cfg.TOKEN) fd.set('token', cfg.TOKEN);
        fd.set('id', id);
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function (d) { if (d.error) throw new Error(d.error); });
      }
      var all = JSON.parse(localStorage.getItem('fin_tx') || '[]').filter(function (t) { return t.id !== id; }); localStorage.setItem('fin_tx', JSON.stringify(all)); return Promise.resolve();
    },
    getBudget: function (m) { if (useSheet) return fetch(cfg.APPS_SCRIPT_URL + '?' + qstr(withToken({ action: 'getBudget', month: m }))).then(function (r) { return r.json(); }).then(function (d) { return d.budget || 0; }); return Promise.resolve(Number(localStorage.getItem('fin_budget_' + m) || 0)); },
    setBudget: function (m, a) { if (useSheet) { var fd = new URLSearchParams(); fd.set('action', 'setBudget'); if (!cfg.USE_PROXY && cfg.TOKEN) fd.set('token', cfg.TOKEN); fd.set('month', m); fd.set('amount', a); return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function () { return a; }); } localStorage.setItem('fin_budget_' + m, String(a)); return Promise.resolve(a); }
  };
  var RecStore = {
    list: function () { return Promise.resolve(JSON.parse(localStorage.getItem('fin_rec') || '[]')); },
    save: function (arr) { localStorage.setItem('fin_rec', JSON.stringify(arr)); return Promise.resolve(arr); }
  };

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function thisMonth() { return todayISO().slice(0, 7); }
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function monthName(m) { var p = (m || '').split('-'); if (p.length < 2) return m; var mo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']; return mo[parseInt(p[1], 10) - 1] + ' ' + p[0]; }

  var state = { tx: [], rec: [], month: thisMonth(), type: '', account: '', q: '' };
  var charts = {};

  function init() {
    if (!useSheet) $('#banner').textContent = 'Mode DEMO — data tersimpan di browser ini. (Setup di config.js untuk simpan ke Google Sheet)';
    else $('#banner').style.display = 'none';

    var cf = $('#f_category'); ACCOUNTS.forEach(function (a) { var o = document.createElement('option'); o.value = a; o.textContent = a; $('#f_account').appendChild(o); });
    CATS.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = FC.catIcon(c) + ' ' + c; cf.appendChild(o); });
    $('#f_type').value = 'expense';
    var ra = $('#r_account'); ACCOUNTS.forEach(function (a) { var o = document.createElement('option'); o.value = a; o.textContent = a; ra.appendChild(o); });

    populateMonths();
    bind();
    load();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(function () {});
  }

  function populateMonths() {
    var sel = $('#f_month'); var cur = thisMonth(); var y = parseInt(cur.slice(0, 4), 10);
    sel.innerHTML = '';
    for (var i = 0; i < 12; i++) { var m = new Date(y, 11 - i, 1).toISOString().slice(0, 7); var o = document.createElement('option'); o.value = m; o.textContent = monthName(m); sel.appendChild(o); }
    if (![].some.call(sel.options, function (o) { return o.value === cur; })) sel.value = cur; else sel.value = cur;
  }

  function bind() {
    $('#txForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var tx = { id: genId(), date: $('#f_date').value || todayISO(), type: $('#f_type').value, account: $('#f_account').value, category: $('#f_category').value, amount: Number($('#f_amount').value) || 0, note: $('#f_note').value };
      if (!tx.amount) return toast('Jumlah wajib diisi');
      Storage.add(tx).then(function () { toast('Tersimpan ✓'); resetForm(); load(); }).catch(function (e) { toast('Gagal: ' + e.message); });
    });
    $('#f_month').addEventListener('change', function () { state.month = this.value; render(); });
    $('#f_type_filter').addEventListener('change', function () { state.type = this.value; render(); });
    $('#f_account_filter').addEventListener('change', function () { state.account = this.value; render(); });
    $('#f_search').addEventListener('input', function () { state.q = this.value; renderTable(); });
    $('#seg_expense').addEventListener('click', function () { setType('expense'); });
    $('#seg_income').addEventListener('click', function () { setType('income'); });
    $('#exportBtn').addEventListener('click', exportCSV);
    $('#pdfBtn').addEventListener('click', exportPDF);
    $('#b_set').addEventListener('click', setBudget);
    $('#fab').addEventListener('click', function () { $('#date').value = todayISO(); openModal('#addModal'); });
    $('#addModal').querySelector('.close').addEventListener('click', function () { closeModal('#addModal'); });
    $('#editModal').querySelector('.close').addEventListener('click', function () { closeModal('#editModal'); });
    $('#editForm').addEventListener('submit', function (e) {
      e.preventDefault(); var id = $('#e_id').value;
      var tx = { id: id, date: $('#e_date').value, type: $('#e_type').value, account: $('#e_account').value, category: $('#e_category').value, amount: Number($('#e_amount').value) || 0, note: $('#e_note').value };
      Storage.update(tx).then(function () { toast('Diperbarui ✓'); closeModal('#editModal'); load(); }).catch(function (e) { toast('Gagal: ' + e.message); });
    });
    // recurring
    $('#recForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var r = { id: genId(), name: $('#r_name').value, day: Number($('#r_day').value) || 1, account: $('#r_account').value, category: $('#r_category').value, amount: Number($('#r_amount').value) || 0, note: $('#r_note').value };
      if (!r.amount) return toast('Jumlah wajib diisi');
      state.rec.push(r); RecStore.save(state.rec).then(function () { toast('Langganan disimpan ✓'); $('#recForm').reset(); renderRec(); });
    });
  }

  function setType(t) { $('#f_type').value = t; $('#seg_expense').classList.toggle('on', t === 'expense'); $('#seg_income').classList.toggle('on', t === 'income'); }
  function resetForm() { $('#txForm').reset(); $('#f_date').value = todayISO(); $('#f_type').value = 'expense'; setType('expense'); }
  function openModal(s) { $(s).classList.add('show'); } function closeModal(s) { $(s).classList.remove('show'); }

  function load() {
    Storage.list().then(function (tx) { state.tx = tx; return RecStore.list(); }).then(function (rec) { state.rec = rec || []; render(); renderRec(); });
  }

  function render() { renderSummary(); renderAccounts(); renderBudget(); renderTable(); renderCharts(); }

  function renderSummary() {
    var m = state.month; var s = FC.summary(state.tx, m);
    var prevM = prevMonth(m); var prev = FC.summary(state.tx, prevM); var prevExp = prev ? prev.expense : 0;
    $('#bal').textContent = FC.formatCurrency(s.balance, cfg.CURRENCY);
    $('#inc').textContent = FC.formatCurrency(s.income, cfg.CURRENCY);
    $('#exp').textContent = FC.formatCurrency(s.expense, cfg.CURRENCY);
    var dir = s.expense <= prevExp ? 'green' : 'red'; var arr = s.expense <= prevExp ? '▼' : '▲';
    $('#expSub').innerHTML = prevExp ? 'vs ' + monthName(prevM) + ': <span style="color:var(--' + dir + ')">' + arr + ' ' + FC.formatCurrency(Math.abs(s.expense - prevExp), cfg.CURRENCY) + '</span>' : 'belum ada data bulan lalu';
  }

  function prevMonth(m) { var d = new Date(m + '-01'); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }

  function renderAccounts() {
    var box = $('#acctGrid'); var ab = FC.byAccount(state.tx, state.month);
    if (!ab.length) { box.innerHTML = '<div class="mini" style="color:var(--muted)">Belum ada saldo bulan ini.</div>'; return; }
    box.innerHTML = ab.map(function (a) {
      var ini = (a.account || '?').slice(0, 1).toUpperCase();
      return '<div class="acct"><div class="dot">' + ini + '</div><div><div class="name">' + esc(a.account) + '</div><div class="bal">' + FC.formatCurrency(a.balance, cfg.CURRENCY) + '</div><div class="mini">masuk ' + FC.formatCurrency(a.income, cfg.CURRENCY) + ' · keluar ' + FC.formatCurrency(a.expense, cfg.CURRENCY) + '</div></div></div>';
    }).join('');
  }

  function renderBudget() {
    Storage.getBudget(state.month).then(function (b) {
      $('#b_in').value = b || '';
      var spent = FC.summary(state.tx, state.month).expense;
      $('#b_cur').textContent = FC.formatCurrency(spent, cfg.CURRENCY);
      var note = $('#b_note'); var bar = $('#b_prog');
      if (!b) { bar.style.width = '0%'; bar.parentElement.classList.remove('over'); note.textContent = 'Belum di-set. Tap Set untuk mulai melacak.'; return; }
      var pct = Math.min(100, Math.round(spent * 100 / b));
      bar.style.width = pct + '%';
      var over = spent > b; bar.parentElement.classList.toggle('over', over);
      var sisa = b - spent;
      note.innerHTML = over ? '<span style="color:var(--red);font-weight:600">Lewat ' + FC.formatCurrency(Math.abs(sisa), cfg.CURRENCY) + ' (' + pct + '%)</span>' : 'Sisa ' + FC.formatCurrency(sisa, cfg.CURRENCY) + ' (' + pct + '% terpakai)';
    });
  }
  function setBudget() { var a = Number($('#b_in').value) || 0; Storage.setBudget(state.month, a).then(function () { toast('Budget disimpan ✓'); renderBudget(); }); }

  function renderTable() {
    var rows = FC.filterTx(state.tx, { month: state.month, type: state.type, account: state.account, q: state.q });
    rows = FC.sortedDesc(rows);
    var tb = $('#txBody');
    if (!rows.length) {
      tb.innerHTML = '';
      $('#txEmpty').style.display = 'block';
      return;
    }
    $('#txEmpty').style.display = 'none';
    tb.innerHTML = rows.map(function (t) {
      var c = catColor(t.category);
      var isInc = t.type === 'income';
      return '<tr>' +
        '<td>' + (t.date || '').slice(0, 10) + '</td>' +
        '<td><span class="tag"><span class="dotc" style="background:' + c + '"></span>' + FC.catIcon(t.category) + ' ' + esc(t.category) + '</span></td>' +
        '<td>' + esc(t.account) + '</td>' +
        '<td>' + esc(t.note || '') + '</td>' +
        '<td class="amt ' + (isInc ? 'inc' : 'exp') + '">' + (isInc ? '+' : '-') + FC.formatCurrency(t.amount, cfg.CURRENCY) + '</td>' +
        '<td><div class="rowact"><button class="iconbtn" data-edit="' + t.id + '">✏️</button><button class="iconbtn" data-del="' + t.id + '">🗑️</button></div></td>' +
        '</tr>';
    }).join('');
    [].forEach.call(tb.querySelectorAll('[data-edit]'), function (b) { b.addEventListener('click', function () { editTx(this.getAttribute('data-edit')); }); });
    [].forEach.call(tb.querySelectorAll('[data-del]'), function (b) { b.addEventListener('click', function () { if (confirm('Hapus transaksi ini?')) del(this.getAttribute('data-del')); }); });
  }

  function editTx(id) {
    var t = state.tx.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    $('#e_id').value = t.id; $('#e_date').value = (t.date || '').slice(0, 10); $('#e_type').value = t.type; $('#e_account').value = t.account; $('#e_category').value = t.category; $('#e_amount').value = t.amount; $('#e_note').value = t.note || '';
    openModal('#editModal');
  }
  function del(id) { Storage.remove(id).then(function () { toast('Dihapus'); load(); }).catch(function (e) { toast('Gagal: ' + e.message); }); }

  function renderRec() {
    var box = $('#recList');
    if (!state.rec.length) { box.innerHTML = '<div class="mini" style="color:var(--muted)">Belum ada langganan.</div>'; return; }
    box.innerHTML = state.rec.map(function (r) {
      return '<div class="acct"><div class="dot" style="background:var(--red-soft);color:var(--red)">🔁</div><div><div class="name">' + esc(r.name || r.category) + '</div><div class="bal" style="color:var(--red)">-' + FC.formatCurrency(r.amount, cfg.CURRENCY) + '</div><div class="mini">tiap tgl ' + r.day + ' · ' + esc(r.account) + '</div></div><button class="iconbtn" data-rmrec="' + r.id + '">✕</button></div>';
    }).join('');
    [].forEach.call(box.querySelectorAll('[data-rmrec]'), function (b) { b.addEventListener('click', function () { state.rec = state.rec.filter(function (r) { return r.id !== this.getAttribute('data-rmrec'); }, b); RecStore.save(state.rec).then(renderRec); }); });
  }

  function renderCharts() {
    var cat = FC.breakdownByCategory(state.tx, state.month);
    var acc = FC.byAccount(state.tx, state.month).filter(function (a) { return a.expense > 0; });
    drawPie('pieCat', cat.map(function (c) { return { label: c.category, value: c.amount, color: catColor(c.category) }; }), 'per kategori');
    drawPie('pieAcc', acc.map(function (a, i) { return { label: a.account, value: a.expense, color: COLORS[i % COLORS.length] }; }), 'per akun');
  }

  function drawPie(canvasId, data, emptyLabel) {
    var cv = document.getElementById(canvasId); if (!cv) return;
    var ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height);
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    if (!total) { ctx.fillStyle = '#94a3b8'; ctx.font = '13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Belum ada data', cv.width / 2, cv.height / 2); return; }
    var cx = cv.width / 2, cy = cv.height / 2, r = Math.min(cx, cy) - 10; var start = -Math.PI / 2;
    data.forEach(function (d) { var ang = d.value / total * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + ang); ctx.closePath(); ctx.fillStyle = d.color; ctx.fill(); start += ang; });
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(FC.formatCurrency(total, cfg.CURRENCY).replace(cfg.CURRENCY + ' ', ''), cx, cy + 4);
  }

  function exportCSV() {
    var rows = FC.filterTx(state.tx, { month: state.month });
    var blob = new Blob([FC.toCSV(rows)], { type: 'text/csv' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'keuangan-' + state.month + '.csv'; a.click(); toast('CSV diunduh');
  }
  function exportPDF() {
    var w = window.open('', '_blank'); if (!w) return toast('Popup diblokir');
    var m = state.month, s = FC.summary(state.tx, m); var rows = FC.sortedDesc(FC.filterTx(state.tx, { month: m }));
    var html = '<html><head><title>Laporan ' + m + '</title><style>body{font-family:Inter,Arial;padding:24px;color:#0f172a}h1{font-size:18px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px}.pos{color:#16a34a}.neg{color:#e11d48}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{text-align:left;padding:8px;border-bottom:1px solid #eee;font-size:12px}</style></head><body>';
    html += '<h1>💰 Laporan Keuangan — ' + monthName(m) + '</h1>';
    html += '<div class="row"><span>Saldo</span><b>' + FC.formatCurrency(s.balance, cfg.CURRENCY) + '</b></div>';
    html += '<div class="row"><span>Pemasukan</span><b class="pos">' + FC.formatCurrency(s.income, cfg.CURRENCY) + '</b></div>';
    html += '<div class="row"><span>Pengeluaran</span><b class="neg">' + FC.formatCurrency(s.expense, cfg.CURRENCY) + '</b></div>';
    html += '<table><tr><th>Tgl</th><th>Kategori</th><th>Akun</th><th>Note</th><th style="text-align:right">Jumlah</th></tr>';
    rows.forEach(function (t) { html += '<tr><td>' + (t.date || '').slice(0, 10) + '</td><td>' + FC.catIcon(t.category) + ' ' + esc(t.category) + '</td><td>' + esc(t.account) + '</td><td>' + esc(t.note || '') + '</td><td style="text-align:right" class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '-') + FC.formatCurrency(t.amount, cfg.CURRENCY) + '</td></tr>'; });
    html += '</table><p style="margin-top:20px;color:#64748b;font-size:11px">Dibuat dari Keuangan Pribadi</p></body></html>';
    w.document.write(html); w.document.close(); setTimeout(function () { w.print(); }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Bridge untuk quick-add modal (FAB)
  window.__quickAdd = function (tx) {
    Storage.add(tx).then(function () { toast('Tersimpan ✓'); closeModal('#addModal'); document.getElementById('quick_amount').value=''; document.getElementById('quick_note').value=''; load(); }).catch(function (e) { toast('Gagal: ' + e.message); });
  };
})();
