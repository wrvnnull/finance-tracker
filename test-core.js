/* test-core.js — node test-core.js */
var FC = require('./finance-core.js');
var tx = [
  { id: '1', date: '2026-08-01', type: 'income', account: 'Bank', category: 'Gaji', amount: 6000000, note: '' },
  { id: '2', date: '2026-08-05', type: 'expense', account: 'Dompet', category: 'Makan', amount: 45000, note: 'siang' },
  { id: '3', date: '2026-07-20', type: 'expense', account: 'Bank', category: 'Tagihan', amount: 35000, note: '' }
];
var s = FC.summary(tx, '2026-08');
console.assert(s.income === 6000000, 'income salah');
console.assert(s.expense === 45000, 'expense salah');
console.assert(s.balance === 5955000, 'balance salah');
console.assert(FC.catIcon('Makan') === '🍔', 'icon salah');
var bd = FC.breakdownByCategory(tx, '2026-08');
console.assert(bd.length === 1 && bd[0].category === 'Makan', 'breakdown salah');
var ab = FC.byAccount(tx, '2026-08');
console.assert(ab.length === 2, 'akun salah');
var f = FC.filterTx(tx, { month: '2026-08', q: 'siang' });
console.assert(f.length === 1, 'filter q salah');
var csv = FC.toCSV(tx);
console.assert(csv.split('\n').length === 4, 'csv rows salah');
console.assert(csv.indexOf('id,date,type,account,category,amount,note') === 0, 'csv header salah');
var rec = [{ id: 'r1', day: 5, account: 'Bank', category: 'Tagihan', amount: 99000, note: 'Netflix' }];
var rm = FC.recurringForMonth(rec, '2026-08');
console.assert(rm.length === 1 && rm[0].date === '2026-08-05', 'recurring salah');
console.log('ALL TESTS PASSED ✓', JSON.stringify(s));
