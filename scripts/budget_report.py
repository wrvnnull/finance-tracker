#!/usr/bin/env python3
"""Hitung ringkasan budget bulan ini dari Google Apps Script, kirim ke Telegram.

Env yang dibutuhkan:
  APPS_SCRIPT_URL, APPS_SCRIPT_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
Jika TELEGRAM_BOT_TOKEN kosong -> hanya print pesan (mode dry-run, untuk test).
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


def build_message(base_url, token):
    month = os.environ.get("FORCE_MONTH") or _now_month()
    # budget
    b = fetch_json(f"{base_url}?action=getBudget&month={month}&token={token}")
    budget = int(float(b.get("budget", 0) or 0))
    # transaksi
    lst = fetch_json(f"{base_url}?action=list&token={token}")
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
    # fallback lokal kalau tidak ada modul datetime (jarang)
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
    base = os.environ.get("APPS_SCRIPT_URL")
    tok = os.environ.get("APPS_SCRIPT_TOKEN") or os.environ.get("TOKEN")
    if not base or not tok:
        print("ENV belum lengkap (APPS_SCRIPT_URL, APPS_SCRIPT_TOKEN).", file=sys.stderr)
        sys.exit(1)
    msg = build_message(base, tok)
    print(msg)
    send_telegram(msg)
