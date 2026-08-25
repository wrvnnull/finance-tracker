# Keuangan Pribadi 💰

Tracker keuangan harian yang **100% gratis**:
- 🗄️ Database = **Google Sheets** (lewat Google Apps Script, tanpa server)
- 🌐 Frontend = **GitHub Pages** (atau cukup buka `index.html`)
- 📊 Grafik = Chart.js (CDN gratis)
- 📱 **PWA** — bisa di-install ke HP & dibuka offline

Mode default jalan di **Demo** (data di `localStorage`) tanpa setup apa-apa.
Mau data awet & bisa dibuka dari HP mana saja? Ikuti setup Google Sheets di bawah.

---

## Fitur
- Tambah pemasukan / pengeluaran (tanggal, kategori, jumlah, catatan)
- **Edit & hapus** transaksi
- Ringkasan saldo / pemasukan / pengeluaran
- **Budget bulanan** + progress bar (peringatan kalau lewat budget)
- **Perbandingan** pengeluaran bulan ini vs bulan lalu
- Filter per bulan, tipe, dan kata kunci
- Grafik batang (per bulan) & doughnut (per kategori) dengan warna per kategori
- Export ke CSV
- PWA: install ke home screen HP, cache offline

## Cara pakai (tanpa setup — Demo)
Buka `index.html` di browser. Data tersimpan di browser itu sendiri.

## Cara setup Google Sheets (database awet)
1. Buat Google Sheet baru. Spreadsheet ID ada di URL:
   `https://docs.google.com/spreadsheets/d/ID_INI/edit` → `ID_INI`.
2. Di Sheet: **Extensions → Apps Script**.
3. Hapus isi, tempel kode dari [`apps-script/Code.gs`](apps-script/Code.gs).
4. Ganti `GANTI_DENGAN_TOKEN_RAHASIA` di `CONFIG.TOKEN` dengan string acak.
5. **Deploy → New deployment** → tipe **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy URL Web App (berakhiran `/exec`).
7. Edit [`config.js`](config.js):
   ```js
   window.APP_CONFIG = {
     APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXX/exec',
     TOKEN: 'rahasia123xyz',
     CURRENCY: 'Rp'
   };
   ```
8. Refresh. Banner "Mode DEMO" hilang → data masuk ke Sheet.

> ⚠️ Keamanan: "Anyone" di Apps Script berarti URL bisa diakses siapa saja,
> makanya **wajib pakai TOKEN**. Jangan commit `config.js` berisi URL+token ke
> repo publik. Untuk privasi lebih kuat, ubah "Who has access" jadi akun Google
> kamu sendiri (app hanya jalan saat kamu login Google di perangkat itu).

## Pasang ke HP (buka tiap hari)
1. Deploy ke GitHub Pages (lihat bawah) atau hosting statis apa pun.
2. **Android (Chrome):** buka URL → ⋮ menu → "Add to Home screen" / "Install app".
3. **iPhone (Safari):** buka URL → Share → "Add to Home Screen".
   Buka dari ikon di home screen → jalan layaknya app, bisa offline (data dari Sheet saat online).
> Catatan: PWA butuh diakses lewat **https** (GitHub Pages memenuhi ini) supaya
> bisa di-install. Budget disimpan di localStorage masing-masing perangkat.

## Deploy ke GitHub Pages (gratis)
1. `git init` (kalau belum), commit, lalu `git push` ke repo GitHub.
2. Repo → **Settings → Pages** → source: branch `main` / folder `/root`.
3. Buka `https://<user>.github.io/<repo>/`.

## Struktur file
```
finance-tracker/
├─ index.html          # UI utama + modal edit
├─ style.css           # tema gelap, card, progress, modal
├─ app.js              # UI + storage (Sheet/localStorage) + PWA + budget
├─ finance-core.js     # fungsi murni (summary, filter, csv, update)
├─ config.js           # ISI URL + TOKEN DI SINI
├─ manifest.webmanifest# metadata PWA
├─ service-worker.js   # cache offline
├─ icon.svg            # ikon app
├─ apps-script/
│  └─ Code.gs          # backend gratisan (Web App → REST API)
├─ test-core.js        # test logika (node test-core.js)
└─ README.md
```

## Test
```
node test-core.js
# ALL TESTS PASSED ✓
```

## Gratis sampai kapan?
- GitHub Pages: gratis selamanya untuk repo publik.
- Google Apps Script: kuota ~20k request/hari (cukup untuk pemakaian pribadi).
- Chart.js: open source.

Dibuat untuk kepake sehari-hari tanpa biaya server.
