const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const url = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(url);

  // Mode demo banner harus muncul (config kosong)
  const banner = await page.textContent('#banner');
  console.log('banner:', banner.slice(0, 30));

  // Isi form tambah
  await page.fill('#f_date', '2026-08-25');
  await page.selectOption('#f_type', 'expense');
  await page.fill('#f_category', 'Makan');
  await page.fill('#f_amount', '45000');
  await page.fill('#f_note', 'makan siang');
  await page.click('#txForm button[type="submit"]');
  await page.waitForTimeout(300);

  // Cek baris tabel muncul
  const rows = await page.$$eval('#txBody tr', rs => rs.map(r => r.textContent));
  console.log('rows after add:', rows.length);
  console.log('row text:', rows[0] ? rows[0].replace(/\s+/g, ' ').trim() : 'NONE');

  // Cek summary pengeluaran update
  const exp = await page.textContent('#exp');
  console.log('expense summary:', exp);

  // Cek budget box render
  const hasBudgetInput = await page.$('#b_in') !== null;
  console.log('budget box has target input:', hasBudgetInput);

  console.log('JS errors:', errors.length ? errors : 'NONE');
  await browser.close();

  // assertions
  const ok = errors.length === 0 && rows.length === 1 && /45\.000/.test(exp) && hasBudgetInput;
  console.log(ok ? 'BROWSER TEST PASSED ✓' : 'BROWSER TEST FAILED ✗');
  process.exit(ok ? 0 : 1);
})();
