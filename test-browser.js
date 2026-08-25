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

  const banner = await page.textContent('#banner');
  console.log('banner shown:', banner.length > 10);

  // Isi form dengan akun
  await page.fill('#f_date', '2026-08-25');
  await page.selectOption('#f_type', 'expense');
  await page.selectOption('#f_account', 'Bank');
  await page.fill('#f_category', 'Makan');
  await page.fill('#f_amount', '45000');
  await page.fill('#f_note', 'makan siang');
  await page.click('#txForm button[type="submit"]');
  await page.waitForTimeout(300);

  const rows = await page.$$eval('#txBody tr', rs => rs.map(r => r.textContent));
  console.log('rows:', rows.length);
  console.log('row has Bank:', /Bank/.test(rows[0] || ''));

  const exp = await page.textContent('#exp');
  console.log('expense:', exp);

  // account cards
  const accts = await page.$$eval('#acctGrid .acct', a => a.length);
  console.log('account cards:', accts);

  // budget input appears (demo -> localStorage budget not set)
  const hasBudgetInput = await page.$('#b_in') !== null;
  console.log('budget input present:', hasBudgetInput);

  // PDF + CSV buttons
  const pdfBtn = await page.$('#pdfBtn') !== null;
  const csvBtn = await page.$('#exportBtn') !== null;
  console.log('pdf+csv buttons:', pdfBtn && csvBtn);

  console.log('JS errors:', errors.length ? errors : 'NONE');
  await browser.close();

  const ok = errors.length === 0 && rows.length === 1 && /Bank/.test(rows[0]) &&
    /45\.000/.test(exp) && accts >= 1 && hasBudgetInput && pdfBtn && csvBtn;
  console.log(ok ? 'BROWSER TEST PASSED ✓' : 'BROWSER TEST FAILED ✗');
  process.exit(ok ? 0 : 1);
})();
