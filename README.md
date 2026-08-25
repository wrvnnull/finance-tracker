# Keuangan Pribadi 💰

Tracker keuangan harian **100% gratis**, desain fintech modern (clean, light, ala Figma/Canva).
Database = **Google Sheets**, frontend = **Cloudflare Pages**, proxy token = **Cloudflare Worker**.

Live: https://finance-tracker-19f.pages.dev

## Fitur
- 🏦 **Multi-akun** (Dompet / Bank / Crypto / Lainnya) + saldo per akun
- ➕ Tambah / **edit / hapus** transaksi
- 📊 Ringkasan saldo · pemasukan · pengeluaran + **compare bulan ini vs lalu**
- 🎯 **Budget bulanan** + progress bar (peringatan kalau lewat)
- 🔎 Filter bulan · tipe · akun · kata kunci
- 📈 Grafik batang (per bulan) & doughnut (per kategori) — Chart.js
- 📄 **Export CSV** & **Export PDF** laporan
- 📱 **PWA** — install ke HP, cache offline
- 🔔 **Reminder budget harian ke Telegram** (GitHub Actions)
- 🔒 Token disembunyikan di Cloudflare Worker (tidak ada di browser/repo)

Mode Demo jalan otomatis (localStorage) kalau belum disetup.

---

## Arsitektur (semua gratis)
```
Browser ──► Cloudflare Pages (frontend statis)
                │  fetch (tanpa token)
                ▼
        Cloudflare Worker (proxy, ada TOKEN di env)
                │  + token lalu forward
                ▼
        Google Apps Script ──► Google Sheet (database)
```

## 1. Google Sheet + Apps Script (database)
1. Buat Google Sheet baru.
2. **Extensions → Apps Script**, hapus isi, tempel [`apps-script/Code.gs`](apps-script/Code.gs).
3. Ganti `TOKEN` di `CONFIG.TOKEN` dengan string acak.
4. **Deploy → New deployment → Web app**: Execute as **Me**, access **Anyone**.
5. Copy URL Web App (`/exec`).

## 2. Cloudflare Worker (proxy — sembunyikan token)
1. https://workers.cloudflare.com → **Create** → **Start with Hello World!**
2. Di editor: klik file → `Ctrl+A` → `Ctrl+V` paste [`worker.js`](worker.js).
3. **Deploy** → dapat URL `https://finance-tracker-proxy.<sub>.workers.dev`
4. **Settings → Variables** → tambah (pilih **Text**, boleh **Encrypt**):
   - `APPS_SCRIPT_URL` = URL Web App dari langkah 1.5
   - `APPS_SCRIPT_TOKEN` = token yang sama
5. Save / Deploy lagi.

## 3. Cloudflare Pages (frontend)
1. Dashboard CF → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pilih repo `wrvnnull/finance-tracker`.
3. Build: Framework **None**, Build command kosong, Output directory `/`.
4. **Save & Deploy** → dapat URL `https://finance-tracker.<sub>.pages.dev`.

## 4. Hubungkan app ke Worker
Edit [`config.js`](config.js):
```js
window.APP_CONFIG = {
  APPS_SCRIPT_URL: 'https://finance-tracker-proxy.<sub>.workers.dev', // URL Worker
  TOKEN: '',            // kosong — token di Worker
  USE_PROXY: true,      // token disembunyikan di server
  CURRENCY: 'Rp',
  ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
};
```
Commit & push. App memanggil Worker, Worker menyuntik token ke Apps Script.

## 5. Reminder Telegram (opsional)
1. @BotFather → `/newbot` → dapat **BOT_TOKEN**.
2. Chat bot, ambil **CHAT_ID** (@userinfobot).
3. Repo → **Settings → Secrets → Actions** tambah:
   - `CF_WORKER_URL` = URL Worker
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
4. Workflow [`budget-reminder.yml`](.github/workflows/budget-reminder.yml) jalan tiap 08:00 WIB.

## Pasang ke HP (buka tiap hari)
- **Android (Chrome):** buka URL → ⋮ → "Add to Home screen" / "Install app".
- **iPhone (Safari):** buka URL → Share → "Add to Home Screen".

## Struktur
```
finance-tracker/
├─ index.html              UI fintech
├─ style.css               tema terang, rounded, shadow halus, dark-mode auto
├─ app.js                  UI + storage (Sheet/localStorage) + PWA + akun + PDF
├─ finance-core.js         fungsi murni (summary, filter, akun, csv, update)
├─ config.js               ISI URL Worker + ACCOUNTS (token di Worker)
├─ manifest.webmanifest    metadata PWA
├─ service-worker.js       cache offline
├─ icon.svg
├─ worker.js               Cloudflare proxy (token hidden)
├─ apps-script/Code.gs     backend Apps Script (REST + budget)
├─ scripts/budget_report.py  pesan Telegram
├─ .github/workflows/budget-reminder.yml
└─ README.md
```

## Test
```
node test-core.js     # logika inti
```

## Gratis sampai kapan?
- Cloudflare Pages: unlimited bandwidth statis.
- Cloudflare Worker: 100.000 req/hari.
- Google Apps Script: ~20k req/hari.
- GitHub Actions: 2.000 menit/bulan (cron harian aman).
- Chart.js: open source.

Dibuat untuk kepake sehari-hari, tanpa biaya server.
