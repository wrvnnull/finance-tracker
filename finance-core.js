/*
 * finance-core.js — fungsi murni (tanpa DOM). Dipakai browser & Node (test).
 */
(function (global) {
  'use strict';

  function fmt(n, cur) {
    n = Number(n) || 0;
    var neg = n < 0;
    var v = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + (cur || 'Rp') + ' ' + v;
  }

  var CATEGORY_ICONS = {
    Makan: '🍔', Transport: '🚗', Belanja: '🛍️', Tagihan: '🧾',
    Hiburan: '🎮', Kesehatan: '💊', Pendidikan: '📚', Donasi: '🤝',
    Gaji: '💼', Investasi: '📈', Lainnya: '📦'
  };
  function catIcon(c) { return CATEGORY_ICONS[c] || CATEGORY_ICONS.Lainnya; }

  function monthKey(d) { return String(d || '').slice(0, 7); }

  function summary(tx, month) {
    var inc = 0, exp = 0;
    tx.forEach(function (t) {
      var m = monthKey(t.date);
      if (month && m !== month) return;
      var amt = Number(t.amount) || 0;
      if (t.type === 'income') inc += amt; else exp += amt;
    });
    return { income: inc, expense: exp, balance: inc - exp };
  }

  function byMonth(tx, month) {
    return tx.filter(function (t) { return !month || monthKey(t.date) === month; });
  }

  function breakdownByCategory(tx, month) {
    var map = {};
    byMonth(tx, month).forEach(function (t) {
      if (t.type === 'income') return;
      var c = t.category || 'Lainnya';
      map[c] = (map[c] || 0) + (Number(t.amount) || 0);
    });
    return Object.keys(map).map(function (k) {
      return { category: k, amount: map[k] };
    }).sort(function (a, b) { return b.amount - a.amount; });
  }

  function byAccount(tx, month) {
    var map = {};
    tx.forEach(function (t) {
      if (month && monthKey(t.date) !== month) return;
      var a = t.account || 'Lainnya';
      if (!map[a]) map[a] = { account: a, income: 0, expense: 0, balance: 0 };
      var amt = Number(t.amount) || 0;
      if (t.type === 'income') { map[a].income += amt; map[a].balance += amt; }
      else { map[a].expense += amt; map[a].balance -= amt; }
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function monthlyTotals(tx) {
    var map = {};
    tx.forEach(function (t) {
      var m = monthKey(t.date); if (!m) return;
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      var amt = Number(t.amount) || 0;
      if (t.type === 'income') map[m].income += amt; else map[m].expense += amt;
    });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  }

  function filterTx(tx, f) {
    f = f || {};
    return tx.filter(function (t) {
      if (f.month && monthKey(t.date) !== f.month) return false;
      if (f.type && t.type !== f.type) return false;
      if (f.account && t.account !== f.account) return false;
      if (f.q) {
        var q = String(f.q).toLowerCase();
        var hay = (t.category + ' ' + t.note + ' ' + t.account).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function sortedDesc(tx) {
    return tx.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date)) || String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }

  function replaceById(tx, upd) {
    return tx.map(function (t) { return t.id === upd.id ? upd : t; });
  }

  function toCSV(tx) {
    var head = 'id,date,type,account,category,amount,note';
    var rows = tx.map(function (t) {
      return [t.id, t.date, t.type, t.account, t.category, t.amount, '"' + String(t.note || '').replace(/"/g, '""') + '"'].join(',');
    });
    return [head].concat(rows).join('\n');
  }

  // Materialize recurring (langganan) untuk bulan tertentu → list transaksi "rencana"
  function recurringForMonth(recurring, month) {
    if (!month) return [];
    var y = parseInt(month.slice(0, 4), 10), mo = parseInt(month.slice(5, 7), 10);
    var days = new Date(y, mo, 0).getDate();
    return recurring.filter(function (r) {
      var dom = r.day || 1; if (dom > days) dom = days;
      return true;
    }).map(function (r) {
      var dom = r.day || 1; var days2 = new Date(y, mo, 0).getDate(); if (dom > days2) dom = days2;
      var dd = (dom < 10 ? '0' + dom : dom);
      return { id: 'rec_' + r.id + '_' + month, date: month + '-' + dd, type: 'expense',
        account: r.account, category: r.category, amount: r.amount, note: (r.note || '') + ' (otomatis)', recurring: true };
    });
  }

  global.FinanceCore = {
    formatCurrency: fmt, catIcon: catIcon, monthKey: monthKey,
    summary: summary, byMonth: byMonth, breakdownByCategory: breakdownByCategory,
    byAccount: byAccount, monthlyTotals: monthlyTotals, filterTx: filterTx,
    sortedDesc: sortedDesc, replaceById: replaceById, toCSV: toCSV,
    recurringForMonth: recurringForMonth, CATEGORY_ICONS: CATEGORY_ICONS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.FinanceCore;
})(typeof window !== 'undefined' ? window : this);
