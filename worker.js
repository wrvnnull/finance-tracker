/**
 * Cloudflare Worker — proxy antara browser (Cloudflare Pages) dan Google Apps Script.
 * TOKEN disimpan di env var Worker, JADI TIDAK PERNAH KELUAR KE BROWSER.
 *
 * Deploy: https://workers.cloudflare.com → Create → Start with Hello World! →
 * paste kode ini → Deploy. Lalu Settings → Variables, isi:
 *   APPS_SCRIPT_URL   = https://script.google.com/macros/s/AKfycbxh.../exec
 *   APPS_SCRIPT_TOKEN = k3u4ng4nPrib4di_9zQ2xL
 *
 * Browser mengirim: ?action=list (GET) atau POST form (action di body) + payload.
 * Worker menyuntik token lalu meneruskan ke Apps Script. Respons dikasih CORS *.
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    // Ambil action dari query (GET) ATAU body form (POST)
    let action = new URL(request.url).searchParams.get('action') || '';
    let bodyText = null;
    let ctype = 'application/x-www-form-urlencoded';

    if (request.method === 'POST') {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await request.json();
        if (!action && j.action) action = j.action;
        j.token = env.APPS_SCRIPT_TOKEN;
        bodyText = JSON.stringify(j);
        ctype = 'application/json';
      } else {
        const form = await request.formData();
        if (!action && form.get('action')) action = form.get('action');
        form.set('token', env.APPS_SCRIPT_TOKEN);
        bodyText = new URLSearchParams(form).toString();
      }
    }

    const allowed = ['list', 'add', 'update', 'delete', 'getBudget', 'setBudget'];
    if (!allowed.includes(action)) {
      return json({ error: 'action tidak diizinkan: ' + action }, 400);
    }

    const target = new URL(env.APPS_SCRIPT_URL);
    // teruskan query params (action, month, dsb) lalu token
    for (const [k, v] of new URL(request.url).searchParams) target.searchParams.set(k, v);
    target.searchParams.set('token', env.APPS_SCRIPT_TOKEN);

    const resp = await fetch(target.toString(), {
      method: request.method,
      headers: { 'content-type': ctype },
      body: bodyText,
      redirect: 'follow'
    });
    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { 'content-type': 'application/json', ...cors() }
    });
  }
};

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
}
function json(obj, code) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { 'content-type': 'application/json', ...cors() }
  });
}
