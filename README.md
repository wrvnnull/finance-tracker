# Keuangan Pribadi 💰

Tracker keuangan harian yang **100% gratis**:
- 🗄️ Database = **Google Sheets** (lewat Google Apps Script, tanpa server)
- 🌐 Frontend = **GitHub Pages** (atau cukup buka `index.html` di browser)
- 📊 Grafik = Chart.js (CDN gratis)

Mode default jalan di **Demo** (data di `localStorage`) tanpa setup apa-apa.
Mau data awet & bisa dibuka dari HP mana saja? Ikuti setup Google Sheets di bawah.

---

## Cara pakai (tanpa setup — Demo)
Cukup buka `index.html` di browser. Data tersimpan di browser itu sendiri.

## Cara setup Google Sheets (pakai sebagai database)
1. Buat Google Sheet baru. Salin ID sheet dari URL:
   `https://docs.google.com/spreadsheets/d/ID_INI/edit` → `ID_INI` adalah Spreadsheet ID.
2. Di Sheet: **Extensions → Apps Script**.
3. Hapus isi, lalu tempel kode dari [`apps-script/Code.gs`](apps-script/Code.gs).
4. Ganti `GANTI_DENGAN_TOKEN_RAHASIA` di `CONFIG.TOKEN` dengan string acak (mis. `rahasia123xyz`).
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
8. Refresh `index.html`. Banner "Mode DEMO" akan hilang — data sekarang masuk ke Sheet.

> Keamanan: "Anyone" di Apps Script berarti URL bisa diakses siapa saja, makanya
> **wajib pakai TOKEN**. Jangan bagikan URL+token. Buat privasi lebih kuat, ubah
> "Who has access" jadi akun Google kamu sendiri (lalu buka app saat sudah login).

## Deploy ke GitHub Pages (gratis)
1. `git init` di folder ini, commit, lalu `git push` ke repo GitHub kamu.
2. Repo → **Settings → Pages** → source: branch `main` / folder `/root`.
3. Buka `https://<user>.github.io/<repo>/`.

## Struktur file
```
finance-tracker/
├─ index.html          # UI utama
├─ style.css           # tema gelap
├─ app.js              # logika UI + storage (Sheet atau localStorage)
├─ finance-core.js     # fungsi murni (summary, filter, csv)
├─ config.js           # ISI URL + TOKEN DI SINI
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

## Fitur
- Tambah pemasukan / pengeluaran (tanggal, kategori, jumlah, catatan)
- Ringkasan saldo / pemasukan / pengeluaran
- Filter per bulan, tipe, dan kata kunci
- Grafik batang (per bulan) & doughnut (per kategori)
- Export ke CSV

## Gratis sampai kapan?
- GitHub Pages: gratis selamanya untuk repo publik.
- Google Apps Script: kuota ~20k request/hari (cukup banget untuk pemakaian pribadi).
- Chart.js: open source.

Dibuat untuk kepake sehari-hari tanpa biaya server.
