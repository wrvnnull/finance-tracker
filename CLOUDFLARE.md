# Deploy di Cloudflare (Pages + Worker) — 100% gratis

Frontend di **Cloudflare Pages**, proxy token di **Cloudflare Worker**.
Satu ekosistem, gratis, token tidak pernah ada di browser.

## A. Cloudflare Worker (proxy — token disembunyikan)
1. https://workers.cloudflare.com → **Create** → **Start with Hello World!**
2. Di editor: klik file `worker.js`, tekan `Ctrl+A` lalu `Ctrl+V` → paste isi [`worker.js`](worker.js).
3. **Deploy** → dapat URL: `https://finance-tracker-proxy.<sub>.workers.dev`
4. **Settings → Variables** → tambah:
   - `APPS_SCRIPT_URL` = `https://script.google.com/macros/s/AKfycbxh08y0xHqQt4wEfFkgLKtwqxNWGGVRMxYOU5GkfQLFvBCuepOlg2vGqEA_NhS636Y8/exec`
   - `APPS_SCRIPT_TOKEN` = `k3u4ng4nPrib4di_9zQ2xL`
5. Save / Deploy lagi.

## B. Cloudflare Pages (frontend)
1. Dashboard CF → **Workers & Pages** → **Create** → pilih tab **Pages** → **Connect to Git**.
2. Pilih repo GitHub `wrvnnull/finance-tracker`.
3. Settings build:
   - Framework preset: **None**
   - Build command: (kosongkan)
   - Output directory: `/`  (atau `.`)
4. **Save & Deploy** → dapat URL: `https://finance-tracker.<sub>.pages.dev`
   (Bisa tambahkan custom domain nanti di tab Custom domains.)

## C. Hubungkan app ke Worker
Edit [`config.js`](config.js):
```js
window.APP_CONFIG = {
  APPS_SCRIPT_URL: 'https://finance-tracker-proxy.<sub>.workers.dev', // URL Worker
  TOKEN: '',
  USE_PROXY: true,
  CURRENCY: 'Rp',
  ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
};
```
Commit & push → app di Pages memanggil Worker, Worker menyuntik token ke Apps Script.

## D. Reminder Telegram (GitHub Actions, panggil lewat Worker)
Di repo GitHub → Settings → Secrets → Actions, tambah:
- `CF_WORKER_URL` = URL Worker (dari A.3)
- `APPS_SCRIPT_TOKEN` = token (opsional, untuk direct mode; Worker mode tidak wajib)
- `TELEGRAM_BOT_TOKEN` = token bot
- `TELEGRAM_CHAT_ID` = chat id kamu

Workflow [`budget-reminder.yml`](.github/workflows/budget-reminder.yml) jalan tiap 08:00 WIB.

## E. Verifikasi
- Buka URL Pages → tambah 1 transaksi → cek muncul di Google Sheet.
- DevTools → Network: request ke Worker tidak mengandung token.
- (Opsional) Jalankan workflow manual → cek pesan Telegram masuk.

## Catatan
- Pages gratis: unlimited bandwidth untuk situs statis.
- Worker gratis: 100.000 request/hari.
- Token hanya ada di Cloudflare (server) + Google Apps Script. Tidak di repo / browser.
