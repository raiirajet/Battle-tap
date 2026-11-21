# BATTLE TAP 🎮

**Flutter mobile game prototype and Firebase backend scaffold — GDD version 1.1**

> Current state: **development source, not a completed production game**. The two playable game modes, the skin previews, the gold record effect and local practice are implemented. A production release requires additional configuration, deployment and testing as listed below.

## Features in this repository

| Capability | State |
|---|---|
| TAP BATTLE: fixed centered button, 44% screen width, 30s, +1 per valid tap | Implemented locally |
| RANDOM HUNT: 18–60s random visible timer; repositions on hit and after 1s idle | Implemented locally |
| RANDOM HUNT: 2s STOP phase, −2 per late tap | Implemented locally |
| Touch handling: no continuous hold points; no overlapping pointer points | Implemented locally |
| All 15 individually styled skins + default, animated preview | Implemented, cosmetic previews only |
| Golden Splash on a new practice/verified record | Implemented; practice marked as preview |
| Account registration: email, Google, Apple | Firebase integration written; OAuth setup required |
| Worldwide, country, weekly, all-time leaderboard | Firebase integration written; deploy and test required |
| Friends, friend requests, challenges | Backend integration written; integration tests required |
| Verified session scoring with server-owned result and rate checks | Backend implemented; security audit required |
| Real-money skin purchases / restore purchases | **Not implemented; deliberately disabled** |
| Automatic anti-cheat device integrity attestations | **Not configured** |
| Full moderation/admin dashboard, achievements, 4-language UI | **Not implemented** |
| Public privacy policy / terms / release documents | **Not yet supplied** |
| Android APK | CI workflow prepares debug APK after repository push; not yet built |
| iOS release | iOS platform project can be generated; signing / macOS build pending |

## Locked game rules (GDD v1.1)

| Rule | Value |
|---|---|
| TAP BATTLE length | 30.00 seconds |
| Ranked button diameter | **44%** logical screen width |
| Ranked button | Stationary, centered |
| Ranked tap score | +1 |
| Random Hunt length | Uniformly sampled integer **18–60 seconds** |
| Random Hunt timer | **Visible** |
| Random Hunt target | Smaller, moving |
| Position after hit | Immediately changes |
| Position after no hit | Changes after **1,000 ms** |
| Wrong tap | 0 |
| Random Hunt late tap | **−2** each |
| STOP reaction phase | **2 seconds** |
| Public rankings | **TAP BATTLE only**, authenticated server-verified results |

The canonical values are in `lib/src/rules.dart`. Backend must agree on timing/version.

## Run local practice (without Firebase)

Install **Flutter stable** (Dart comes with Flutter). The project includes the Dart sources but does not check in generated native folders. Generate them once:

```bash
flutter create --platforms=android,ios --project-name battle_tap --org ch.battletap .
python3 scripts/configure_android_permissions.py
flutter pub get
flutter test
flutter run
```

Without Firebase configuration, the app launches in **LOCAL PRACTICE ONLY** mode, clearly marked. No fake online rankings or fake transactions are created. Scores in practice are stored on the device with `shared_preferences`.

## BattleTap branding (app launcher, login, play, rankings, shop)

The original BattleTap neon artwork is bundled offline in `assets/branding/`:
- `app_icon.png` is the Android/iOS launcher icon and the PLAY tab mark.
- `battle_tap_logo.webp` is used in the sign-in screen and the play homepage.
- `bt_badge.webp` is used for the rankings tab, shop and player profile.

The graphics are optimized for APK size; original high-resolution files are kept outside the repository.
During APK builds, `dart run flutter_launcher_icons` creates the Android launcher icon (including adaptive icon) and iOS icons from `app_icon.png` after native platform scaffolding is generated. For local builds, run:

```bash
flutter create --platforms=android,ios --project-name battle_tap --org ch.battletap .
python3 scripts/configure_android_permissions.py
flutter pub get
dart run flutter_launcher_icons
flutter run
```

## Arcade audio, combo feedback and optional permissions

- Fourteen **original, locally generated** PCM WAV effects live under `assets/audio/`: eight progressively brighter tap sounds, countdown, start, stop, miss, combo and record.
- The preloaded `audioplayers` low-latency pools are fire-and-forget, so audio never blocks pointer handling or changes verified scoring.
- The tap tone progresses with number of hits, consecutive hit chain and current taps per second; milestone chimes are emitted at 10, 25, 50 and later every 25 hits.
- Lightweight ring/ray feedback is drawn over the play field via an `IgnorePointer` painter. The existing `Reduce animations` preference disables these cosmetic effects.
- First launch displays an optional consent/preferences screen for sounds, vibration, visual effects and notifications. No automatic OS notification request occurs until the user explicitly opts in.
- The notification toggle and its OS permission are **preparation for future challenges**; the current offline prototype does not yet deliver notifications. No location, contacts, photo or microphone permission is requested.
- For Android, generate native files first and then run `python3 scripts/configure_android_permissions.py` to add `POST_NOTIFICATIONS` to the generated manifest. CI executes this step automatically.

## Build an APK

```bash
flutter build apk --debug
```

The local APK path is `build/app/outputs/flutter-apk/app-debug.apk`.

The workflow `.github/workflows/android-apk.yml` runs on GitHub pushes and can be started manually under **Actions → Build Android APK (development) → Run workflow**. After a successful workflow, retrieve the `battle-tap-debug-apk` artifact. The workflow generates Android/iOS scaffolding in CI and creates a **development/debug** APK, not a store-signed release.

## Configure Firebase for online features

1. Create a Firebase project with Authentication (Email/Password, Google, Apple), Cloud Firestore and Cloud Functions.
2. Configure the Android SHA keys and OAuth providers; configure iOS bundle identifiers, URL schemes and Apple sign-in capability. Do not commit private signing keys or secrets.
3. Create the correct **Android and iOS Firebase apps** and obtain each platform's application ID and options. Production builds require the appropriate values per platform.
4. Install the Firebase CLI and run `firebase login`, `firebase use --add` and then `firebase deploy --only functions,firestore` from this directory. Note: Cloud Functions and related services may require a billed Firebase plan.
5. Add Firebase client options using environment variables or CI secrets passed to Flutter as `--dart-define` values:

```bash
flutter run \
  --dart-define=FIREBASE_API_KEY=YOUR_API_KEY \
  --dart-define=FIREBASE_APP_ID=YOUR_PLATFORM_APP_ID \
  --dart-define=FIREBASE_SENDER_ID=YOUR_MESSAGING_SENDER_ID \
  --dart-define=FIREBASE_PROJECT_ID=YOUR_PROJECT_ID \
  --dart-define=FIREBASE_IOS_BUNDLE_ID=ch.battletap.battle_tap
```

**Important:** Firebase app IDs and OAuth setups differ on Android/iOS. The configuration must match the platform, and Android Google Sign-in and Apple Sign-in require additional provider setup. The location of Cloud Functions is `europe-west6` in both client and backend; coordinate deployment and calls if changing the region.

The current functions are an initial verification design: they prevent blindly accepting a client-supplied score, enforce a 30-second time window, validate event ordering and restrict updates to the backend. **Client-supplied tap events remain forgeable**, so a competitive public release additionally requires device attestation, abuse monitoring, fraud escalation and penetration testing.

## Skin shop

All 15 planned skins appear under Normal, Epic and Legend and show dynamic previews:

- Normal (CHF 0.90 proposed): Red Strike, Ocean Blue, Toxic Green, Royal Purple, Golden Yellow.
- Epic (CHF 2.90 proposed): Neon Pulse, Inferno Core, Plasma Venom, Thunder Violet, Frozen Prism.
- Legend (CHF 5.90 proposed): Solar Deity, Void Dragon, Phoenix Heart, Celestial Crown, Cosmic Singularity.

**Purchasing is intentionally disabled.** Before enabling real transactions, register store products in Google Play Console/App Store Connect, implement respective platform in-app billing with **server-side receipt verification**, account entitlements, restore-purchases and compliance testing. Never mark a skin as owned on client acknowledgement alone.

## What's needed for production

- Complete StoreKit / Google Play Billing purchase flows, receipt validation and ownership.
- Integrate Play Integrity and App Attest, strengthen anti-cheat beyond plausible tap timing.
- Complete moderation/admin UI and anti-abuse processes.
- Internationalize the app into DE, EN, FR and Albanian, and finish achievement presentation.
- Configure OAuth, legal documents, full deletion/retention policy and privacy reviews.
- Improve offline failure modes, loading, accessibility, animation reduced-motion, notifications and sound assets.
- Add end-to-end device tests, load tests, backend emulator integration tests and a release signing pipeline.
- Validate app functionality on physical Android and iOS devices and pass the stores' reviews.

For detailed scope and acceptance criteria, see `docs/GDD_v1.1.md`.

## Key files

- `lib/src/rules.dart`: locked gameplay rules and pure scoring.
- `lib/src/game_page.dart`: actual touch interaction, phase and timers.
- `lib/src/widgets/skin_button.dart`: 15 button appearance effects.
- `lib/src/widgets/golden_splash.dart`: record animation.
- `lib/src/online.dart`: Firebase auth/callable functions/read models.
- `functions/index.js`: trusted sessions, scores, profiles, friends, challenges and deletion.
- `firestore.rules`, `firestore.indexes.json`: data access and ranking indexes.
- `test/`: scoring and catalog regression tests.
- `.github/workflows/`: APK and backend checks.

## License and release status

No commercial production release is authorized or implied by this prototype. Store credentials, purchase product IDs, privacy documents and legal licensing must be completed first.
