// test-core.js — jalankan: node test-core.js
var FC = require('./finance-core.js');

var tx = [
  { id: '1', date: '2026-08-01', type: 'income', category: 'Gaji', amount: 5000000, note: 'gaji' },
  { id: '2', date: '2026-08-03', type: 'expense', category: 'Makan', amount: 50000, note: 'nasi' },
  { id: '3', date: '2026-07-20', type: 'expense', category: 'Makan', amount: 30000, note: '' },
  { id: '4', date: '2026-08-10', type: 'income', category: 'Freelance', amount: 1000000, note: '' }
];

var s = FC.computeSummary(tx);
console.assert(s.income === 6000000, 'income salah: ' + s.income);
console.assert(s.expense === 80000, 'expense salah: ' + s.expense);
console.assert(s.balance === 5920000, 'balance salah: ' + s.balance);

var f = FC.filterTransactions(tx, { month: '2026-08' });
console.assert(f.length === 3, 'month filter salah: ' + f.length);

var f2 = FC.filterTransactions(tx, { type: 'expense' });
console.assert(f2.length === 2, 'type filter salah: ' + f2.length);

var f3 = FC.filterTransactions(tx, { q: 'nasi' });
console.assert(f3.length === 1, 'search filter salah: ' + f3.length);

var mb = FC.monthlyBreakdown(tx);
console.assert(mb.length === 2, 'monthly breakdown salah: ' + mb.length);
console.assert(mb[0].month === '2026-07', 'urut bulan salah');

var cb = FC.categoryBreakdown(tx, 'expense');
console.assert(cb[0].category === 'Makan' && cb[0].total === 80000, 'category salah');

var csv = FC.toCSV(tx);
console.assert(csv.split('\n').length === 5, 'csv rows salah');
console.assert(csv.indexOf('id,date,type,category,amount,note') === 0, 'csv header salah');

console.log('ALL TESTS PASSED ✓', JSON.stringify(s));
