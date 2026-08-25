/*
 * config.js — ISI APPS_SCRIPT_URL & TOKEN SETELAH deploy Google Apps Script (lihat README).
 * Kosongkan keduanya untuk Mode Demo (data di localStorage browser).
 */
window.APP_CONFIG = {
  // URL Web App dari Deploy > Manage deployments di Google Apps Script
  APPS_SCRIPT_URL: '',

  // Token rahasia SAMA dengan CONFIG.TOKEN di dalam Code.gs
  TOKEN: '',

  // Mata uang yang ditampilkan
  CURRENCY: 'Rp',

  // Daftar akun (bisa diubah sesuai kebutuhan: Dompet, Bank, Crypto, dll)
  ACCOUNTS: ['Dompet', 'Bank', 'Crypto', 'Lainnya']
};
