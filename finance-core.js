/*
 * finance-core.js
 * Fungsi murni (tanpa DOM) untuk agregasi & format data keuangan.
 * Dipakai baik di browser (window.FinanceCore) maupun Node (untuk test).
 */
(function (global) {
  'use strict';

  function parseAmount(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function isIncome(t) {
    return t.type === 'income' || t.type === 'pemasukan';
  }

  function formatCurrency(amount, currency) {
    currency = currency || 'Rp';
    var num = parseAmount(amount);
    return currency + ' ' + num.toLocaleString('id-ID');
  }

  function computeSummary(transactions) {
    var income = 0, expense = 0;
    transactions.forEach(function (t) {
      if (isIncome(t)) income += parseAmount(t.amount);
      else expense += parseAmount(t.amount);
    });
    return { income: income, expense: expense, balance: income - expense };
  }

  function filterTransactions(transactions, opts) {
    opts = opts || {};
    return transactions.filter(function (t) {
      if (opts.month && t.date && t.date.slice(0, 7) !== opts.month) return false;
      if (opts.type && t.type !== opts.type) return false;
      if (opts.q) {
        var q = String(opts.q).toLowerCase();
        var hay = ((t.note || '') + ' ' + (t.category || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function monthlyBreakdown(transactions) {
    var map = {};
    transactions.forEach(function (t) {
      if (!t.date) return;
      var m = t.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      map[m][isIncome(t) ? 'income' : 'expense'] += parseAmount(t.amount);
    });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  }

  function categoryBreakdown(transactions, type) {
    var map = {};
    transactions.forEach(function (t) {
      if (type && t.type !== type) return;
      var c = t.category || 'Lainnya';
      map[c] = (map[c] || 0) + parseAmount(t.amount);
    });
    return Object.keys(map).map(function (k) {
      return { category: k, total: map[k] };
    }).sort(function (a, b) { return b.total - a.total; });
  }

  function toCSV(transactions) {
    var header = ['id', 'date', 'type', 'category', 'amount', 'note'];
    var rows = transactions.map(function (t) {
      return header.map(function (h) {
        var val = t[h] == null ? '' : String(t[h]);
        if (/[",\n]/.test(val)) val = '"' + val.replace(/"/g, '""') + '"';
        return val;
      }).join(',');
    });
    return header.join(',') + '\n' + rows.join('\n');
  }

  var API = {
    parseAmount: parseAmount,
    isIncome: isIncome,
    formatCurrency: formatCurrency,
    computeSummary: computeSummary,
    filterTransactions: filterTransactions,
    monthlyBreakdown: monthlyBreakdown,
    categoryBreakdown: categoryBreakdown,
    toCSV: toCSV
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (global) global.FinanceCore = API;
})(typeof window !== 'undefined' ? window : this);
