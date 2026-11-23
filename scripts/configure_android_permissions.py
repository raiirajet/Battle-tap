#!/usr/bin/env python3
"""Add Internet and Android 13+ notification permissions after flutter create.

The native Android directory is generated in CI rather than checked into Git.
"""
from pathlib import Path

manifest = Path("android/app/src/main/AndroidManifest.xml")
if not manifest.exists():
    raise SystemExit("Missing AndroidManifest.xml; run flutter create first")

original = manifest.read_text(encoding="utf-8")
text = original
for name in ("android.permission.INTERNET", "android.permission.POST_NOTIFICATIONS"):
    if f'"{name}"' in text:
        continue
    marker = "<application"
    if marker not in text:
        raise SystemExit("Android manifest has no <application tag")
    permission = f'<uses-permission android:name="{name}" />'
    text = text.replace(marker, permission + "\n    " + marker, 1)
# Display the proper game name under its Android launcher icon.
text = text.replace('android:label="battle_tap"', 'android:label="BattleTap"')
if text != original:
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
print("BattleTap Android API 37 and app permissions configured")
