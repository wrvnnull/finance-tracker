#!/usr/bin/env python3
"""Hitung ringkasan budget bulan ini, kirim ke Telegram.

Mode:
  - Jika APPS_SCRIPT_TOKEN ada  -> panggil URL langsung (direct ke Apps Script), token disisipkan.
  - Jika APPS_SCRIPT_TOKEN kosong -> asumsi APPS_SCRIPT_URL adalah Cloudflare Worker
    (token disuntik Worker di server, tidak dikirim dari sini).

Env:
  APPS_SCRIPT_URL   (wajib) -> URL Apps Script ATAU URL Cloudflare Worker
  APPS_SCRIPT_TOKEN (opsional, direct mode)
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (opsional, kosong = dry-run/print)
  FORCE_MONTH (opsional, format YYYY-MM)
"""
import json
import os
import sys
import urllib.request
import urllib.parse


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "budget-reminder"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def build_message():
    base = os.environ.get("APPS_SCRIPT_URL")
    token = os.environ.get("APPS_SCRIPT_TOKEN")
    if not base:
        print("ENV APPS_SCRIPT_URL belum diset", file=sys.stderr)
        sys.exit(1)
    # Sisipkan token hanya di direct mode; Worker sudah menyuntik di server.
    sep = "&" if "?" in base else "?"
    tok = ("&token=" + urllib.parse.quote(token)) if token else ""

    month = os.environ.get("FORCE_MONTH") or _now_month()
    b = fetch_json(f"{base}?action=getBudget&month={month}{tok}")
    budget = int(float(b.get("budget", 0) or 0))
    lst = fetch_json(f"{base}?action=list{tok}")
    data = lst.get("data", [])
    spent = sum(int(float(t.get("amount", 0))) for t in data
                if t.get("type") != "income" and str(t.get("date", "")).startswith(month))

    if budget <= 0:
        return (f"Budget bulan {month} belum di-set.\n"
                f"Buka app, lalu tap 'Set' di panel Budget untuk mulai melacak.")
    sisa = budget - spent
    pct = int(spent * 100 / budget) if budget else 0
    if sisa >= 0:
        emoji, sisa_txt = "✅", f"Sisa Rp {sisa:,}"
    else:
        emoji, sisa_txt = "⚠️", f"Lewat Rp {abs(sisa):,}"
    return (f"Budget Bulan {month} {emoji}\n"
            f"Terpakai: Rp {spent:,} / Rp {budget:,} ({pct}%)\n"
            f"{sisa_txt}")


def _now_month():
    import datetime
    return datetime.date.today().strftime("%Y-%m")


def send_telegram(text):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        print("[dry-run] Telegram kosong, pesan tidak dikirim:\n" + text)
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        print("Telegram status:", r.status)


if __name__ == "__main__":
    msg = build_message()
    print(msg)
    send_telegram(msg)
