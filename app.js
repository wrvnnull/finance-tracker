/* app.js — UI + storage abstraction untuk Personal Finance Tracker (multi-akun, PWA, PDF) */
(function () {
  'use strict';

  var cfg = window.APP_CONFIG || {};
  var FC = window.FinanceCore;
  var useSheet = !!(cfg.APPS_SCRIPT_URL && cfg.TOKEN);

  var ACCOUNTS = (cfg.ACCOUNTS && cfg.ACCOUNTS.length) ? cfg.ACCOUNTS : ['Dompet', 'Bank', 'Crypto', 'Lainnya'];
  var CATEGORY_COLORS = {
    Makan: '#fb7185', Transport: '#60a5fa', Belanja: '#a78bfa', Tagihan: '#fbbf24',
    Hiburan: '#f472b6', Kesehatan: '#34d399', Gaji: '#22c55e', Freelance: '#2dd4bf',
    Investasi: '#38bdf8', Lainnya: '#94a3b8'
  };
  function catColor(c) { return CATEGORY_COLORS[c] || CATEGORY_COLORS.Lainnya; }

  var Storage = {
    list: function () {
      if (useSheet) {
        return fetch(cfg.APPS_SCRIPT_URL + '?action=list&token=' + encodeURIComponent(cfg.TOKEN))
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d.error) throw new Error(d.error); return d.data || []; });
      }
      return Promise.resolve(JSON.parse(localStorage.getItem('fin_tx') || '[]'));
    },
    add: function (tx) {
      if (useSheet) {
        var fd = new URLSearchParams();
        fd.set('action', 'add'); fd.set('token', cfg.TOKEN); fd.set('payload', JSON.stringify(tx));
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d.error) throw new Error(d.error); return tx; });
      }
      var all = JSON.parse(localStorage.getItem('fin_tx') || '[]'); all.push(tx);
      localStorage.setItem('fin_tx', JSON.stringify(all)); return Promise.resolve(tx);
    },
    update: function (tx) {
      if (useSheet) {
        var fd = new URLSearchParams();
        fd.set('action', 'update'); fd.set('token', cfg.TOKEN); fd.set('id', tx.id);
        fd.set('payload', JSON.stringify(tx));
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d.error) throw new Error(d.error); return tx; });
      }
      var all = FC.replaceById(JSON.parse(localStorage.getItem('fin_tx') || '[]'), tx);
      localStorage.setItem('fin_tx', JSON.stringify(all)); return Promise.resolve(tx);
    },
    remove: function (id) {
      if (useSheet) {
        var fd = new URLSearchParams();
        fd.set('action', 'delete'); fd.set('token', cfg.TOKEN); fd.set('id', id);
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d.error) throw new Error(d.error); });
      }
      var all = JSON.parse(localStorage.getItem('fin_tx') || '[]').filter(function (t) { return t.id !== id; });
      localStorage.setItem('fin_tx', JSON.stringify(all)); return Promise.resolve();
    },
    getBudget: function (month) {
      if (useSheet) {
        return fetch(cfg.APPS_SCRIPT_URL + '?action=getBudget&month=' + month + '&token=' + encodeURIComponent(cfg.TOKEN))
          .then(function (r) { return r.json(); }).then(function (d) { return d.budget || 0; });
      }
      return Promise.resolve(Number(localStorage.getItem('fin_budget_' + month) || 0));
    },
    setBudget: function (month, amount) {
      if (useSheet) {
        var fd = new URLSearchParams();
        fd.set('action', 'setBudget'); fd.set('token', cfg.TOKEN); fd.set('month', month); fd.set('amount', amount);
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd })
          .then(function (r) { return r.json(); }).then(function () { return amount; });
      }
      localStorage.setItem('fin_budget_' + month, String(amount));
      return Promise.resolve(amount);
    }
  };

  function $(s) { return document.querySelector(s); }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function thisMonth() { return todayISO().slice(0, 7); }
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function monthName(m) {
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var p = m.split('-'); return M[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  var allTx = [];
  var filters = { month: '', type: '', account: '', q: '' };
  var editingId = null;

  function currentView() { return FC.filterTransactions(allTx, filters); }

  function renderSummary() {
    var s = FC.computeSummary(currentView());
    $('#bal').textContent = FC.formatCurrency(s.balance, cfg.CURRENCY);
    $('#inc').textContent = FC.formatCurrency(s.income, cfg.CURRENCY);
    $('#exp').textContent = FC.formatCurrency(s.expense, cfg.CURRENCY);

    var tm = thisMonth();
    var cur = FC.computeSummary(FC.filterTransactions(allTx, { month: tm }));
    var mb = FC.monthlyBreakdown(allTx);
    var idx = mb.findIndex(function (m) { return m.month === tm; });
    var prev = idx > 0 ? mb[idx - 1] : null;
    var prevExp = prev ? prev.expense : 0;
    var delta = prevExp ? ((cur.expense - prevExp) / prevExp) * 100 : 0;
    var dir = cur.expense <= prevExp ? 'up' : 'down';
    var arrow = cur.expense <= prevExp ? '▼' : '▲';
    $('#expSub').innerHTML = prev
      ? 'vs ' + monthName(prev.month) + ' <span class="pill ' + dir + '">' + arrow + ' ' + Math.abs(delta).toFixed(0) + '%</span>'
      : 'bulan ini';
    $('#cmpCur').textContent = FC.formatCurrency(cur.expense, cfg.CURRENCY);
    $('#cmpPrev').textContent = prev ? FC.formatCurrency(prevExp, cfg.CURRENCY) : 'Rp 0';
  }

  function renderAccounts() {
    var ab = FC.accountBreakdown(allTx);
    var box = $('#acctGrid');
    if (!ab.length) { box.innerHTML = '<div class="mini">Belum ada data akun.</div>'; return; }
    box.innerHTML = ab.map(function (a) {
      return '<div class="acct"><div class="name"><span class="acct-dot"></span>' + escapeHtml(a.account) + '</div>' +
        '<div class="bal">' + FC.formatCurrency(a.balance, cfg.CURRENCY) + '</div>' +
        '<div class="mini">masuk ' + FC.formatCurrency(a.income, cfg.CURRENCY) + ' · keluar ' + FC.formatCurrency(a.expense, cfg.CURRENCY) + '</div></div>';
    }).join('');
  }

  function renderBudget() {
    var month = filters.month || thisMonth();
    Storage.getBudget(month).then(function (budget) {
      var exp = FC.computeSummary(FC.filterTransactions(allTx, { month: month, type: 'expense' })).expense;
      var box = $('#budgetBox');
      if (!budget) {
        box.innerHTML = '<div class="budget-row"><span class="b-label">Belum ada budget untuk ' + monthName(month) + '</span></div>' +
          '<div class="budget-edit"><input type="number" id="b_in" placeholder="Target budget (Rp)" /><button class="sm" id="b_set">Set</button></div>';
      } else {
        var pct = budget ? Math.min(100, (exp / budget) * 100) : 0;
        var over = exp > budget;
        box.innerHTML = '<div class="budget-row"><span>Terpakai</span><span>' +
          FC.formatCurrency(exp, cfg.CURRENCY) + ' / ' + FC.formatCurrency(budget, cfg.CURRENCY) + '</span></div>' +
          '<div class="progress ' + (over ? 'over' : '') + '"><span style="width:' + pct + '%"></span></div>' +
          '<div class="budget-row" style="margin-top:10px"><span class="b-label">' +
          (over ? '⚠️ Lewat budget ' + FC.formatCurrency(exp - budget, cfg.CURRENCY) : 'Sisa ' + FC.formatCurrency(budget - exp, cfg.CURRENCY)) +
          '</span><button class="sm ghost" id="b_edit">Ubah</button></div>';
      }
    });
  }

  function renderTable() {
    var view = currentView().slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var tbody = $('#txBody');
    if (!view.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Belum ada transaksi. Tambah di atas ☝️</td></tr>';
      return;
    }
    tbody.innerHTML = view.map(function (t) {
      var inc = FC.isIncome(t); var col = catColor(t.category);
      return '<tr>' +
        '<td>' + escapeHtml(t.date) + '</td>' +
        '<td>' + (inc ? 'Pemasukan' : 'Pengeluaran') + '</td>' +
        '<td><span class="acct-tag"><span class="acct-dot"></span>' + escapeHtml(t.account || 'Lainnya') + '</span></td>' +
        '<td><span class="cat-tag"><span class="cat-dot" style="background:' + col + '"></span>' + escapeHtml(t.category) + '</span></td>' +
        '<td class="amt ' + (inc ? 'inc' : 'exp') + '">' + (inc ? '+' : '-') + FC.formatCurrency(t.amount, cfg.CURRENCY) + '</td>' +
        '<td>' + escapeHtml(t.note) + '</td>' +
        '<td><button class="edit" data-edit="' + escapeHtml(t.id) + '">Edit</button> ' +
        '<button class="danger" data-del="' + escapeHtml(t.id) + '">Hapus</button></td>' +
        '</tr>';
    }).join('');
  }

  function renderCharts() {
    if (typeof Chart === 'undefined') return;
    var view = currentView();
    var mb = FC.monthlyBreakdown(view);
    var cat = FC.categoryBreakdown(view, 'expense');
    if (window._bar) window._bar.destroy();
    if (window._dough) window._dough.destroy();
    var barCtx = $('#barChart');
    if (barCtx) {
      window._bar = new Chart(barCtx, {
        type: 'bar',
        data: { labels: mb.map(function (m) { return monthName(m.month); }),
          datasets: [
            { label: 'Pemasukan', data: mb.map(function (m) { return m.income; }), backgroundColor: '#16a34a', borderRadius: 6 },
            { label: 'Pengeluaran', data: mb.map(function (m) { return m.expense; }), backgroundColor: '#e11d48', borderRadius: 6 }
          ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
          scales: { y: { ticks: { callback: function (v) { return 'Rp' + (v / 1000) + 'k'; } } } } }
      });
    }
    var dgCtx = $('#catChart');
    if (dgCtx) {
      window._dough = new Chart(dgCtx, {
        type: 'doughnut',
        data: { labels: cat.map(function (c) { return c.category; }),
          datasets: [{ data: cat.map(function (c) { return c.total; }), backgroundColor: cat.map(function (c) { return catColor(c.category); }) }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: { legend: { position: 'bottom', labels: { color: 'var(--muted)', boxWidth: 12, usePointStyle: true } } } }
      });
    }
  }

  function renderAll() { renderSummary(); renderAccounts(); renderBudget(); renderTable(); renderCharts(); }

  function openEdit(id) {
    var t = allTx.find(function (x) { return x.id === id; }); if (!t) return;
    editingId = id;
    $('#e_id').value = t.id; $('#e_date').value = t.date; $('#e_type').value = t.type;
    $('#e_account').value = t.account || ACCOUNTS[0]; $('#e_category').value = t.category;
    $('#e_amount').value = t.amount; $('#e_note').value = t.note || '';
    $('#editModal').classList.add('open');
  }
  function closeEdit() { $('#editModal').classList.remove('open'); editingId = null; }

  function populateMonths() {
    var months = {}; allTx.forEach(function (t) { if (t.date) months[t.date.slice(0, 7)] = 1; });
    var sel = $('#f_month');
    sel.innerHTML = '<option value="">Semua bulan</option>' +
      Object.keys(months).sort().reverse().map(function (m) { return '<option value="' + m + '">' + monthName(m) + '</option>'; }).join('');
  }
  function accountOptions(sel) {
    return ACCOUNTS.map(function (a) { return '<option value="' + a + '">' + a + '</option>'; }).join('');
  }

  function exportPDF() {
    var w = window.open('', '_blank');
    if (!w) { toast('Popup diblokir browser'); return; }
    var view = currentView();
    var s = FC.computeSummary(view);
    var rows = view.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var monthLabel = filters.month ? monthName(filters.month) : 'Semua periode';
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Laporan Keuangan</title>' +
      '<style>body{font-family:Arial,sans-serif;padding:32px;color:#1a1d29}h1{font-size:20px;margin:0 0 4px}' +
      '.m{color:#6b7280;font-size:13px;margin-bottom:18px}table{width:100%;border-collapse:collapse;font-size:13px}' +
      'th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #eee}.r{text-align:right}.g{color:#16a34a}.r2{color:#e11d48}' +
      '.sum{display:flex;gap:24px;margin:14px 0 22px}.sum div{font-size:13px;color:#6b7280}.sum b{display:block;font-size:18px;color:#1a1d29}</style></head><body>' +
      '<h1>Laporan Keuangan</h1><div class="m">Periode: ' + monthLabel + ' · Dicetak ' + todayISO() + '</div>' +
      '<div class="sum"><div>Saldo<b>' + FC.formatCurrency(s.balance) + '</b></div><div>Pemasukan<b>' + FC.formatCurrency(s.income) + '</b></div><div>Pengeluaran<b>' + FC.formatCurrency(s.expense) + '</b></div></div>' +
      '<table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Akun</th><th>Kategori</th><th class="r">Jumlah</th><th>Catatan</th></tr></thead><tbody>';
    if (!rows.length) html += '<tr><td colspan="6">Tidak ada transaksi.</td></tr>';
    rows.forEach(function (t) {
      var inc = FC.isIncome(t);
      html += '<tr><td>' + escapeHtml(t.date) + '</td><td>' + (inc ? 'Pemasukan' : 'Pengeluaran') + '</td><td>' +
        escapeHtml(t.account || 'Lainnya') + '</td><td>' + escapeHtml(t.category) + '</td><td class="r ' + (inc ? 'g' : 'r2') + '">' +
        (inc ? '+' : '-') + FC.formatCurrency(t.amount) + '</td><td>' + escapeHtml(t.note) + '</td></tr>';
    });
    html += '</tbody></table></body></html>';
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { w.print(); }, 350);
  }

  function bind() {
    $('#txForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var tx = {
        id: genId(), date: $('#f_date').value || todayISO(), type: $('#f_type').value,
        account: $('#f_account').value, category: $('#f_category').value.trim() || 'Lainnya',
        amount: FC.parseAmount($('#f_amount').value), note: $('#f_note').value.trim()
      };
      if (!tx.amount) { toast('Jumlah harus diisi'); return; }
      Storage.add(tx).then(Storage.list).then(function (list) {
        allTx = list; $('#txForm').reset(); $('#f_date').value = todayISO(); $('#f_account').value = ACCOUNTS[0];
        populateMonths(); renderAll(); toast('Tersimpan ✓');
      }).catch(function (err) { toast('Gagal: ' + err.message); });
    });

    $('#txBody').addEventListener('click', function (e) {
      var del = e.target.getAttribute('data-del'); var edt = e.target.getAttribute('data-edit');
      if (del) {
        if (!confirm('Hapus transaksi ini?')) return;
        Storage.remove(del).then(Storage.list).then(function (list) { allTx = list; renderAll(); toast('Dihapus'); })
          .catch(function (err) { toast('Gagal: ' + err.message); });
      } else if (edt) { openEdit(edt); }
    });

    ['#f_month', '#f_type_filter', '#f_account_filter', '#f_search'].forEach(function (sel) {
      $(sel).addEventListener('input', function () {
        filters.month = $('#f_month').value; filters.type = $('#f_type_filter').value;
        filters.account = $('#f_account_filter').value; filters.q = $('#f_search').value.trim();
        renderAll();
      });
    });

    $('#budgetBox').addEventListener('click', function (e) {
      if (e.target.id === 'b_set' || e.target.id === 'b_edit') {
        var month = filters.month || thisMonth();
        var cur = ''; Storage.getBudget(month).then(function (b) {
          var val = prompt('Target budget pengeluaran untuk ' + monthName(month) + ' (Rp):', b || '');
          if (val !== null) Storage.setBudget(month, val).then(function () { renderBudget(); toast('Budget disimpan ✓'); });
        });
      }
    });

    $('#editForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var tx = {
        id: $('#e_id').value, date: $('#e_date').value, type: $('#e_type').value,
        account: $('#e_account').value, category: $('#e_category').value.trim() || 'Lainnya',
        amount: FC.parseAmount($('#e_amount').value), note: $('#e_note').value.trim()
      };
      if (!tx.amount) { toast('Jumlah harus diisi'); return; }
      Storage.update(tx).then(Storage.list).then(function (list) {
        allTx = list; closeEdit(); renderAll(); toast('Diperbarui ✓');
      }).catch(function (err) { toast('Gagal: ' + err.message); });
    });

    $('#editCancel').addEventListener('click', closeEdit);
    $('#editModal').addEventListener('click', function (e) { if (e.target.id === 'editModal') closeEdit(); });

    $('#exportBtn').addEventListener('click', exportPDF);
    $('#pdfBtn').addEventListener('click', exportPDF);
  }

  function init() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(function () {});
    if (!useSheet) {
      var b = $('#banner'); b.style.display = 'block';
      b.innerHTML = 'Mode DEMO — data di browser ini (localStorage). Untuk simpan ke Google Sheets & akses dari HP lain, ikuti <a href="README.md">README</a>.';
    }
    $('#f_date').value = todayISO();
    $('#f_account').innerHTML = accountOptions();
    $('#e_account').innerHTML = accountOptions();
    bind();
    Storage.list().then(function (list) {
      allTx = list || []; populateMonths(); renderAll();
    }).catch(function (err) {
      var b = $('#banner'); b.style.display = 'block'; b.textContent = 'Gagal memuat: ' + err.message;
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
