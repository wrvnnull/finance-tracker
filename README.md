# Keuangan Pribadi 💰

Tracker keuangan harian yang **100% gratis**, desain fintech modern (clean, light, ala Figma/Canva):
- 🗄️ Database = **Google Sheets** (lewat Google Apps Script, tanpa server)
- 🌐 Frontend = **GitHub Pages** (atau buka langsung `index.html`)
- 📊 Grafik = Chart.js (CDN gratis)
- 📱 **PWA** — install ke HP, cache offline
- 🏦 **Multi-akun** (Dompet / Bank / Crypto / Lainnya)
- 🎯 **Budget bulanan** + progress + **reminder Telegram** tiap hari
- 📄 **Export PDF** laporan bulanan

Mode default jalan di **Demo** (data di `localStorage`) tanpa setup apa-apa.

---

## Fitur
- Tambah pemasukan/pengeluaran dengan **akun** (Dompet, Bank, Crypto, …)
- **Edit & hapus** transaksi
- Ringkasan saldo / pemasukan / pengeluaran
- **Saldo per akun**
- **Budget bulanan** + progress bar (peringatan kalau lewat)
- **Perbandingan** pengeluaran bulan ini vs bulan lalu
- Filter per bulan, tipe, akun, dan kata kunci
- Grafik batang (per bulan) & doughnut (per kategori)
- **Export CSV** & **Export PDF**
- PWA: install ke home screen, offline-capable
- **Reminder budget harian ke Telegram** (GitHub Actions)

## Cara pakai (tanpa setup — Demo)
Buka `index.html` di browser. Data di localStorage browser itu sendiri.

## Setup Google Sheets (database awet)
1. Buat Google Sheet baru. Spreadsheet ID di URL: `…/spreadsheets/d/ID_INI/edit`.
2. **Extensions → Apps Script**, hapus isi, tempel [`apps-script/Code.gs`](apps-script/Code.gs).
3. Ganti `GANTI_DENGAN_TOKEN_RAHASIA` di `CONFIG.TOKEN` dengan string acak.
4. **Deploy → New deployment** → Web app: Execute as **Me**, access **Anyone**.
5. Copy URL Web App (`/exec`).
6. Edit [`config.js`](config.js):
   ```js
   window.APP_CONFIG = {
     APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXX/exec',
     TOKEN: 'rahasia123xyz',
     CURRENCY: 'Rp',
     ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
   };
   ```
7. Refresh → banner "Mode DEMO" hilang, data masuk ke Sheet.

> ⚠️ Keamanan: "Anyone" di Apps Script artinya URL bisa diakses siapa saja — makanya
> **wajib pakai TOKEN**. Jangan commit `config.js` berisi URL+token ke repo publik.
> Untuk privasi lebih kuat, ubah access jadi akun Google kamu sendiri (app hanya jalan
> saat kamu login Google di perangkat itu).

## Setup Reminder Telegram (opsional)
1. Buat bot dari [@BotFather](https://t.me/BotFather), dapatkan **BOT_TOKEN**.
2. Chat bot sekali, lalu ambil **CHAT_ID** (pakai [@userinfobot](https://t.me/userinfobot) atau cek `getUpdates`).
3. Di repo GitHub → **Settings → Secrets and variables → Actions**, tambah:
   - `APPS_SCRIPT_URL` — URL Web App
   - `APPS_SCRIPT_TOKEN` — TOKEN yang sama
   - `TELEGRAM_BOT_TOKEN` — token bot
   - `TELEGRAM_CHAT_ID` — chat id kamu
4. Workflow [`budget-reminder.yml`](.github/workflows/budget-reminder.yml) jalan tiap hari 08:00 WIB
   (atau jalankan manual: Actions → Budget Reminder → Run workflow).
   Script ada di [`scripts/budget_report.py`](scripts/budget_report.py).

## Pasang ke HP (buka tiap hari)
1. Deploy ke GitHub Pages (lihat bawah) atau hosting statis apa pun.
2. **Android (Chrome):** buka URL → ⋮ → "Add to Home screen" / "Install app".
3. **iPhone (Safari):** buka URL → Share → "Add to Home Screen".
   Buka dari ikon → jalan layaknya app, bisa offline. Budget disimpan per-perangkat (localStorage) atau di Sheet (jika di-setup).

## Deploy ke GitHub Pages (gratis)
1. `git push` ke repo GitHub.
2. Repo → **Settings → Pages** → source: branch `main` / folder `/root`.
3. Buka `https://<user>.github.io/<repo>/`.

## Struktur file
```
finance-tracker/
├─ index.html              # UI fintech (Inter font, card, chart, modal)
├─ style.css               # tema terang, rounded, shadow halus, dark-mode auto
├─ app.js                  # UI + storage (Sheet/localStorage) + PWA + akun + PDF
├─ finance-core.js         # fungsi murni (summary, filter, akun, csv, update)
├─ config.js               # ISI URL + TOKEN + ACCOUNTS DI SINI
├─ manifest.webmanifest    # metadata PWA
├─ service-worker.js       # cache offline
├─ icon.svg
├─ apps-script/Code.gs     # backend gratisan (Web App → REST API + budget)
├─ scripts/budget_report.py# logika pesan Telegram
├─ .github/workflows/budget-reminder.yml
├─ test-core.js            # node test-core.js
├─ test-browser.js         # node test-browser.js (butuh playwright-core)
└─ README.md
```

## Test
```
node test-core.js     # logika
node test-browser.js  # UI headless (perlu playwright-core)
```

## Gratis sampai kapan?
- GitHub Pages: gratis selamanya (repo publik).
- Google Apps Script: ~20k request/hari (cukup pribadi).
- GitHub Actions: 2.000 menit/bulan gratis (cron harian aman).
- Chart.js: open source.

Dibuat untuk kepake sehari-hari, tanpa biaya server.
