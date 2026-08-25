/* app.js — UI + storage abstraction untuk Personal Finance Tracker */
(function () {
  'use strict';

  var cfg = window.APP_CONFIG || {};
  var FC = window.FinanceCore;
  var useSheet = !!(cfg.APPS_SCRIPT_URL && cfg.TOKEN);

  /* ---------- Storage ---------- */
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
        fd.set('action', 'add'); fd.set('token', cfg.TOKEN);
        fd.set('payload', JSON.stringify(tx));
        return fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', body: fd })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d.error) throw new Error(d.error); return tx; });
      }
      var all = JSON.parse(localStorage.getItem('fin_tx') || '[]');
      all.push(tx);
      localStorage.setItem('fin_tx', JSON.stringify(all));
      return Promise.resolve(tx);
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
      localStorage.setItem('fin_tx', JSON.stringify(all));
      return Promise.resolve();
    }
  };

  /* ---------- Helpers ---------- */
  function $(sel) { return document.querySelector(sel); }
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
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---------- State ---------- */
  var allTx = [];
  var filters = { month: '', type: '', q: '' };

  /* ---------- Render ---------- */
  function currentView() {
    return FC.filterTransactions(allTx, filters);
  }

  function renderSummary() {
    var s = FC.computeSummary(currentView());
    $('#bal').textContent = FC.formatCurrency(s.balance, cfg.CURRENCY);
    $('#inc').textContent = FC.formatCurrency(s.income, cfg.CURRENCY);
    $('#exp').textContent = FC.formatCurrency(s.expense, cfg.CURRENCY);
  }

  function renderTable() {
    var view = currentView().slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var tbody = $('#txBody');
    if (!view.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">Belum ada transaksi. Tambah di atas ☝️</td></tr>';
      return;
    }
    tbody.innerHTML = view.map(function (t) {
      var inc = FC.isIncome(t);
      return '<tr>' +
        '<td>' + escapeHtml(t.date) + '</td>' +
        '<td>' + (inc ? 'Pemasukan' : 'Pengeluaran') + '</td>' +
        '<td>' + escapeHtml(t.category) + '</td>' +
        '<td class="amt ' + (inc ? 'inc' : 'exp') + '">' + (inc ? '+' : '-') + FC.formatCurrency(t.amount, cfg.CURRENCY) + '</td>' +
        '<td>' + escapeHtml(t.note) + '</td>' +
        '<td><button class="danger" data-del="' + escapeHtml(t.id) + '">Hapus</button></td>' +
        '</tr>';
    }).join('');
  }

  function renderCharts() {
    if (typeof Chart === 'undefined') return; // chart CDN belum load / offline
    var view = currentView();
    var mb = FC.monthlyBreakdown(view);
    var cat = FC.categoryBreakdown(view, 'expense');

    if (window._bar) window._bar.destroy();
    if (window._dough) window._dough.destroy();

    var barCtx = $('#barChart');
    if (barCtx) {
      window._bar = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: mb.map(function (m) { return m.month; }),
          datasets: [
            { label: 'Pemasukan', data: mb.map(function (m) { return m.income; }), backgroundColor: '#34d399' },
            { label: 'Pengeluaran', data: mb.map(function (m) { return m.expense; }), backgroundColor: '#f87171' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: function (v) { return 'Rp' + (v / 1000) + 'k'; } } } } }
      });
    }
    var dgCtx = $('#catChart');
    if (dgCtx) {
      var palette = ['#818cf8', '#60a5fa', '#34d399', '#f87171', '#fbbf24', '#f472b6', '#a3e635'];
      window._dough = new Chart(dgCtx, {
        type: 'doughnut',
        data: {
          labels: cat.map(function (c) { return c.category; }),
          datasets: [{ data: cat.map(function (c) { return c.total; }), backgroundColor: cat.map(function (_, i) { return palette[i % palette.length]; }) }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  function renderAll() {
    renderSummary();
    renderTable();
    renderCharts();
  }

  /* ---------- Events ---------- */
  function bind() {
    $('#txForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var tx = {
        id: genId(),
        date: $('#f_date').value || todayISO(),
        type: $('#f_type').value,
        category: $('#f_category').value.trim() || 'Lainnya',
        amount: FC.parseAmount($('#f_amount').value),
        note: $('#f_note').value.trim()
      };
      if (!tx.amount) { toast('Jumlah harus diisi'); return; }
      Storage.add(tx).then(function () {
        return Storage.list();
      }).then(function (list) {
        allTx = list;
        $('#txForm').reset();
        $('#f_date').value = todayISO();
        populateMonths();
        renderAll();
        toast('Tersimpan ✓');
      }).catch(function (err) { toast('Gagal: ' + err.message); });
    });

    $('#txBody').addEventListener('click', function (e) {
      var id = e.target.getAttribute('data-del');
      if (!id) return;
      if (!confirm('Hapus transaksi ini?')) return;
      Storage.remove(id).then(function () { return Storage.list(); }).then(function (list) {
        allTx = list; renderAll(); toast('Dihapus');
      }).catch(function (err) { toast('Gagal: ' + err.message); });
    });

    ['#f_month', '#f_type_filter', '#f_search'].forEach(function (sel) {
      $(sel).addEventListener('input', function () {
        filters.month = $('#f_month').value;
        filters.type = $('#f_type_filter').value;
        filters.q = $('#f_search').value.trim();
        renderAll();
      });
    });

    $('#exportBtn').addEventListener('click', function () {
      var csv = FC.toCSV(currentView());
      var blob = new Blob([csv], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'keuangan-' + (filters.month || todayISO().slice(0, 7)) + '.csv';
      a.click();
      toast('CSV diunduh');
    });
  }

  function populateMonths() {
    var months = {};
    allTx.forEach(function (t) { if (t.date) months[t.date.slice(0, 7)] = 1; });
    var sel = $('#f_month');
    var opts = '<option value="">Semua bulan</option>' +
      Object.keys(months).sort().reverse().map(function (m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
    sel.innerHTML = opts;
  }

  /* ---------- Init ---------- */
  function init() {
    if (!useSheet) {
      $('#banner').style.display = 'block';
      $('#banner').innerHTML = 'Mode DEMO — data disimpan di browser ini (localStorage). ' +
        'Untuk simpan ke Google Sheets, ikuti setup di <a href="README.md">README.md</a>.';
    }
    $('#f_date').value = todayISO();
    bind();
    Storage.list().then(function (list) {
      allTx = list || [];
      populateMonths();
      renderAll();
    }).catch(function (err) {
      $('#banner').style.display = 'block';
      $('#banner').textContent = 'Gagal memuat: ' + err.message;
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
