/**
 * Cloudflare Worker — proxy antara browser (GitHub Pages) dan Google Apps Script.
 * TOKEN disimpan di sini (env var), JADI TIDAK PERNAH KELUAR KE BROWSER.
 *
 * Deploy (Cloudflare Dashboard, gratis):
 *   1. https://workers.cloudflare.com → Create Worker → nama "finance-tracker-proxy"
 *   2. Paste kode ini, lalu Save.
 *   3. Settings → Variables, tambah 2 variabel:
 *        APPS_SCRIPT_URL   = https://script.google.com/macros/s/AKfyc.../exec
 *        APPS_SCRIPT_TOKEN = k3u4ng4nPrib4di_9zQ2xL
 *   4. Deploy → dapat URL https://finance-tracker-proxy.<sub>.workers.dev
 *   5. Masukkan URL itu ke config.js (APPS_SCRIPT_URL) + USE_PROXY: true.
 *
 * Browser cuma memanggil Worker dengan action + payload; Worker yang menyuntikkan
 * token lalu meneruskan ke Apps Script. Respons diberi header CORS *.
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';
    const allowed = ['list', 'add', 'update', 'delete', 'getBudget', 'setBudget'];
    if (!allowed.includes(action)) {
      return json({ error: 'action tidak diizinkan: ' + action }, 400);
    }

    // Bangun target ke Apps Script + suntikkan token
    const target = new URL(env.APPS_SCRIPT_URL);
    for (const [k, v] of url.searchParams) target.searchParams.set(k, v);
    target.searchParams.set('token', env.APPS_SCRIPT_TOKEN);

    let body = null;
    let ctype = 'application/x-www-form-urlencoded';
    if (request.method === 'POST') {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await request.json();
        j.token = env.APPS_SCRIPT_TOKEN;
        body = JSON.stringify(j);
        ctype = 'application/json';
      } else {
        const form = await request.formData();
        form.set('token', env.APPS_SCRIPT_TOKEN);
        body = new URLSearchParams(form).toString();
      }
    }

    const resp = await fetch(target.toString(), {
      method: request.method,
      headers: { 'content-type': ctype },
      body,
      redirect: 'follow'
    });
    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { 'content-type': 'application/json', ...corsHeaders() }
    });
  }
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
}

function json(obj, code) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { 'content-type': 'application/json', ...corsHeaders() }
  });
}
