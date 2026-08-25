# Cloudflare Worker (Proxy — Token Disembunyikan)

Tujuannya: **token Apps Script tidak pernah ada di browser/app**, sehingga privasi maksimal.
Browser → Cloudflare Worker (ada token) → Google Apps Script.

## 1. Deploy Worker (gratis, ~3 menit)
1. Buka https://workers.cloudflare.com → **Sign up / Log in** (pakai akun Cloudflare gratis).
2. Klik **Create** (atau "Create Worker") → beri nama `finance-tracker-proxy`.
3. Hapus isi editor, lalu **paste** kode dari [`worker.js`](worker.js) di repo ini.
4. Klik **Save** lalu **Deploy**.
5. Kamu dapat URL seperti:
   `https://finance-tracker-proxy.<subdomain>.workers.dev`
   >>> Copy URL ini.

## 2. Set environment variables (isi token di sini, bukan di app)
Di dashboard Worker → tab **Settings** → **Variables** (atau "Environment Variables"):
- `APPS_SCRIPT_URL` = `https://script.google.com/macros/s/AKfycbxh08y0xHqQt4wEfFkgLKtwqxNWGGVRMxYOU5GkfQLFvBCuepOlg2vGqEA_NhS636Y8/exec`
- `APPS_SCRIPT_TOKEN` = `k3u4ng4nPrib4di_9zQ2xL`
Klik **Save** / **Deploy** lagi supaya variabel aktif.

> Jangan commit token ke repo. Token hanya ada di Cloudflare (server) + Google Apps Script.
> Di `config.js`, `TOKEN` dibiarin kosong dan `USE_PROXY: true`.

## 3. Hubungkan app ke Worker
Edit [`config.js`](config.js), isi:
```js
window.APP_CONFIG = {
  APPS_SCRIPT_URL: 'https://finance-tracker-proxy.<subdomain>.workers.dev',
  TOKEN: '',
  USE_PROXY: true,
  CURRENCY: 'Rp',
  ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
};
```
Lalu commit & push. App sekarang memanggil Worker, Worker menyuntik token ke Apps Script.

## 4. Verifikasi
Buka situs → tambah 1 transaksi → cek muncul di Google Sheet kamu.
Cek juga developer tools browser → di network request ke Worker, token TIDAK ada di body/url.

## Catatan
- Worker gratis: 100.000 request/hari (cron harian + buka app tiap hari aman banget).
- Kalau belum deploy Worker, app otomatis jalan di **Mode Demo** (localStorage) — tidak error.
- Worker sudah handle CORS dan follow redirect dari Apps Script.
