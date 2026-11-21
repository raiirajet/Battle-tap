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
# permission_handler_android 13.x uses Android API 37 to compile.
# Keep the target SDK managed by Flutter; only raise the compile SDK.
gradle = Path("android/app/build.gradle.kts")
if not gradle.exists():
    raise SystemExit("Missing generated android/app/build.gradle.kts")
config = gradle.read_text(encoding="utf-8")
if "compileSdk = flutter.compileSdkVersion" in config:
    config = config.replace(
        "compileSdk = flutter.compileSdkVersion",
        "compileSdk = 37",
        1,
    )
    gradle.write_text(config, encoding="utf-8")
elif "compileSdk = 37" not in config:
    raise SystemExit("Unexpected Android build.gradle.kts compileSdk configuration")
print("BattleTap Android API 37 + notification permission configured")
