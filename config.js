/*
 * config.js — Cloudflare setup: token disembunyikan di Worker (server).
 * Browser hanya panggil Worker; Worker menyuntik token ke Apps Script.
 *
 * Cara deploy lengkap: lihat CLOUDFLARE.md
 */
window.APP_CONFIG = {
  // URL Cloudflare Worker (proxy). Kosong → Mode Demo (localStorage).
  APPS_SCRIPT_URL: 'https://finance-tracker-proxy.irvaaanfauzi.workers.dev',

  // Token Apps Script — KOSONG (disimpan di Cloudflare Worker env).
  TOKEN: '',

  // true = lewat Cloudflare Worker, token disembunyikan di server.
  USE_PROXY: true,

  CURRENCY: 'Rp',
  ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
};
