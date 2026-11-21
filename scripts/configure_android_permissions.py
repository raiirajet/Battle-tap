#!/usr/bin/env python3
"""Idempotently add Android 13+ notifications permission after flutter create.

The native Android directory is generated in CI rather than checked into Git.
"""
from pathlib import Path

manifest = Path("android/app/src/main/AndroidManifest.xml")
if not manifest.exists():
    raise SystemExit("Missing AndroidManifest.xml; run flutter create first")

text = manifest.read_text(encoding="utf-8")
permission = '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
if 'android.permission.POST_NOTIFICATIONS' not in text:
    marker = "<application"
    if marker not in text:
        raise SystemExit("Android manifest has no <application tag")
    text = text.replace(marker, permission + "\n    " + marker, 1)
    manifest.write_text(text, encoding="utf-8")
print("BattleTap Android notification permission configured")
