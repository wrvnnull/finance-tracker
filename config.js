/*
 * config.js — PRIVASI: token TIDAK ada di sini. Disimpan di Cloudflare Worker
 * (lihat worker.js). Browser hanya memanggil Worker, Worker yang nyuntik token.
 *
 * Cara aktifkan (lengkap di README "Cloudflare Worker"):
 *   1. Deploy worker.js ke Cloudflare (gratis) → dapat URL worker.
 *   2. Isi APPS_SCRIPT_URL di bawah dengan URL worker tersebut.
 *   3. USE_PROXY: true (token di-hidden di server, tidak kelihatan di browser).
 *
 * Kalau TIDAK pakai Worker: isi TOKEN di bawah, set USE_PROXY: false.
 * (Token akan kelihatan di source browser — kurang privat.)
 */
window.APP_CONFIG = {
  // URL Cloudflare Worker (proxy). Kosong → Mode Demo (localStorage).
  APPS_SCRIPT_URL: '',

  // Token Apps Script — biarkan KOSONG bila pakai Worker proxy.
  TOKEN: '',

  // true = lewat Cloudflare Worker, token disembunyikan di server.
  USE_PROXY: true,

  CURRENCY: 'Rp',
  ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
};
