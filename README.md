# BATTLE TAP 🎮

**Flutter mobile game prototype and Firebase backend scaffold — GDD version 1.1**

> Current state: **development source, not a completed production game**. The two playable game modes, the skin previews, the gold record effect and local practice are implemented. A production release requires additional configuration, deployment and testing as listed below.

## Features in this repository

| Capability | State |
|---|---|
| TAP BATTLE: starts centered (44% width), shrinks at speed, teleports every 100 hits; 30s, +1 per valid hit | Implemented locally |
| RANDOM HUNT: 18–60s random visible timer; repositions on hit and after 1s idle | Implemented locally |
| RANDOM HUNT: 2s STOP phase, −2 per late tap | Implemented locally |
| BUBBLE RUSH: 45s air-pocket bubbles, harder every 5s, more simultaneous bubbles, combos and original pops | Implemented locally, separate best score |
| COLOR TRAP: 30s fast green targets, red decoys (−2), increasing pace | Implemented locally, separate best score |
| REFLEX GO: 30s, six cycling colors; green +1, red −1, four neutral colors, separate points best | Implemented locally; old millisecond records remain archived, not compared |
| MEMORY MATRIX: 20 escalating stages with 3×3→4×4→5×5 grids, three lives, visible personal best and best level | Implemented locally |
| TIMING STRIKE: ten shots, shows a white marker for the last stopped cursor position and earned points | Implemented locally |
| 1 GEGEN 1 ARCADE: 20s per person, identical seeded targets, separate saved history per named player | Implemented locally |
| Personal best leaderboard and chronological history for all eight playable modes | Device-only; newest 250 completed games/turns, historical bests preserved |
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

## November 23, 2026 — Arcade gameplay & personal records

- **Memory Matrix** now has 20 stages, unlocks 4×4 and 5×5 grids at levels
  8/15, has three lives, and displays best score/best level in the HUD.
- **Precision Trail** has been removed from the game menu and playable
  `SkillMode` options (the old stored preference is not overwritten).
- **Timing Strike** reveals the location where the cursor was stopped on
  the timing bar: a white marker, the previous target outline and the
  score earned by that shot.
- **Reflex GO** is now a 30-second color game. Six colors always change.
  Green: +1; red: −1; blue/purple/yellow/cyan: neutral. Existing
  millisecond records are deliberately not mixed with new point records.
- **Bubble Rush** is 45 seconds; every five seconds the bubble spawn
  interval falls and simultaneous bubble density/burst size increase.
- **Personal bests & history:** The new screen is available from PLAY and
  PROFILE, lists all eight active games and lets players filter a local,
  chronological feed. New completed games are saved with date/time;
  two-player matches save both player names and individual scores.
  Only the most recent 250 rounds/turns are retained in the timeline;
  personal bests remain separately persisted. The timeline begins
  with this update, since older individual rounds cannot be reconstructed.
  Only completed, server-verified Ranked rounds count as verified; this
  feature does not modify the public leaderboards or upload local scores.

## Locked game rules (GDD v1.1)

| Rule | Value |
|---|---|
| TAP BATTLE length | 30.00 seconds |
| Ranked V2 target diameter | **44%** field width initially, shrinks to **11%** at high tapping speed |
| Ranked V2 position | Centered initially; fresh seeded random location after every 100 successful hits |
| Ranked tap score | +1 |
| Random Hunt length | Uniformly sampled integer **18–60 seconds** |
| Random Hunt timer | **Visible** |
| Random Hunt target | Smaller, moving |
| Position after hit | Immediately changes |
| Position after no hit | Changes after **1,000 ms** |
| Wrong tap | 0 |
| Random Hunt late tap | **−2** each |
| STOP reaction phase | **2 seconds** |
| Public rankings | **TAP BATTLE V2**, authenticated and isolated from V1 historical scores |

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

## Ranked V2: rhythm combos, adaptive target and randomized locations

- **Real rhythm combos:** five or more accurately and consistently timed consecutive hits are required to activate a combo. Misses, erratic tap intervals and moves reset it. Combo is purely audio/visual: each valid hit still scores +1.
- **Adaptive hit target:** starts at 44% of playfield width, shrinks smoothly as tapping frequency increases, and reaches 11% (a quarter of its original diameter) at high speed. The hitbox for a tap depends only on earlier valid taps, never on the tap being scored.
- **Different path each match:** every 100 accepted hits moves the button to a new location inside the playfield. Each online match uses a fresh server-provided seed; offline practice generates a fresh seed locally. Moves restart the rhythm and speed window.
- **Score separation:** V2 scores use `rankedBestV2` and `rankedWeeklyV2`. Historic V1 records stay unchanged. Local practice also uses a new V2 best-score key while retaining the old local V1 record. The server checks V2 coordinates against the issued seed, the previous hit times, and the stage of the move counter.
- **Lower latency:** Ranked targets no longer run decorative animation controllers; visual updates are capped at ~30fps, haptics are limited to ~8 per second and tap audio is limited to ~14 per second without throttling hits.

**Firebase deployment needed for actual online V2:** publishing the source and new APK alone does not deploy Cloud Functions, Firestore security rules or indexes. The new app requires the V2 backend for authenticated Ranked sessions. The default APK continues to run local practice without Firebase configuration.

## BattleTap PWA, lifetime stats, free premium skins (November 2026)

The web app is built from the **same Flutter screens and gameplay** as Android. On a wide desktop browser its canvas is capped at 560 logical pixels to keep the original mobile layout; on phones the app fills the screen.

- **Random Hunt color shifting:** the visible tap target switches between seven high-contrast color combinations after every hit or automatic relocation. The selected skin's visual-effects family stays the same.
- **Home statistics:** completed rounds overall, lifetime tap attempts (accepted fresh pointer-downs including misses), and weighted average successful hits per second for each of Random Hunt and Tap Battle. Totals persist using SharedPreferences (browser local storage in the PWA, app storage on Android). Earlier versions saved only completed practice hits, so those become the historical baseline for lifetime taps; separate per-mode averages start with this version.
- **Shop:** four new permanently FREE, immediately equippable buttons: Aurora Flux and Ember Storm with Epic-style effects; Solar Halo and Night Nebula with Legend-style effects. All original paid skins are preserved, but transactions still require actual native store/receipt verification before enabling paid purchases.
- **PWA:** manifest, original branded icon variants, standalone installation, an HTTPS service worker for shell and runtime asset caching, and a GitHub Actions deployment pipeline to GitHub Pages.
- **Web publishing:** `https://raiirajet.github.io/Battle-tap/` becomes available after Pages is enabled and the workflow succeeds. The first run compiled successfully but Pages activation returned **403: Resource not accessible by integration**. A repository administrator must select **Settings → Pages → Build and deployment → Source: GitHub Actions**, then rerun `Build & deploy BattleTap PWA`. The workflow now uploads the compiled site as the `battle-tap-pwa-web` artifact even when Pages has not yet been enabled.
- **Online play:** the PWA and APK builds use their platform's Firebase client configuration when present and offer **LOCAL PRACTICE ONLY** otherwise. Online profiles and verified ranked scores require the V2 Cloud Functions, Firestore rules and indexes. The two device/browser stores do not automatically sync each other's local statistics.

Both Android and PWA can be rebuilt from `main` using their workflows:
- `.github/workflows/android-apk.yml` (debug APK)
- `.github/workflows/deploy-pwa.yml` (web / GitHub Pages)

## Subtle neon arena wallpaper — readability update (November 2026)

The shared `BattleBackdrop` now draws an original, vector-rendered
**arcade arena wallpaper** in `lib/src/widgets/arcade_backdrop_art.dart`.
It includes peripheral radar rings, fine circuit traces, sparse particles,
faint hexagons, and low-intensity gold/cyan edge glows.

**Readability and performance:** The central reading corridor is darkened
separately from the artwork so section headers, menus, and game-mode labels
stay legible. Cards, dialogs and the bottom dock keep their own opaque
high-contrast surfaces. No photography, bright center flare, external asset,
animated particles, added network access, or new permission is required.
The custom painter has `shouldRepaint == false`, sits behind an
`IgnorePointer` and within a `RepaintBoundary`; touch input and game
scoring are unchanged. Applies to Flutter Web/PWA and Android equally.

Tests in `test/arcade_backdrop_test.dart` verify minimum contrast for
foreground text and confirm that background artwork never blocks taps.

## Premium Arcade visual redesign (November 2026)

The visual system in `lib/src/battle_design.dart` gives **all screens** a unified
premium arcade identity while retaining the nine modes and their original rules.

- Deep navy/black backdrop with *static* ambient blue/cyan radial glows, avoiding
  continuously ticking background particle animations.
- Gold primary buttons, bordered secondary actions, dark input panels, consistent
  18–23px radii, and clearly contrasting text and interactive states.
- Custom five-tab **gaming dock** for PLAY / RANKS / SHOP / FRIENDS / PROFILE.
  It retains tab history and does not replace native back navigation.
- PLAY includes a compact logo hero, nine differentiated mode tiles, improved
  score metrics and category headers.
- All game screens feature a dark gridded arena and visually separate
  timer/score HUD panels; modes retain distinct accent colors.
- Shop displays skins in rarity-tinted premium panels; rankings use podium
  styling for the leading three; friends, profile and settings share bordered surfaces.
- Memory Matrix uses illuminated animated grid tiles.
- No new network services, data collection or permissions are required.

The gameplay and existing Firebase verification protocol were **not modified**.
Effects follow the user's existing game settings where applicable; the new
backdrop and arena grids are intentionally static. The web and Android builds
share the same Dart UI code.

## Four more skill games — November 2026

The PLAY screen includes four additional modes alongside Tap Battle, Random Hunt and the original three Arcade games:

- **MEMORY MATRIX:** A 3×3 grid shows a sequence of glowing fields. Reproduce the order from memory. It starts with two flashes and adds one field every level, up to ten levels. Each correct input gives one point; completing a level gives two bonus points. The game ends on the first incorrect input or after level ten.
- **PRECISION TRAIL:** Drag your finger to follow a smoothly moving light along a curved path. The round lasts 30 seconds. Accuracy is the percent of 33ms samples for which your finger remains within the target's proximity radius; the locally stored best is your highest percentage.
- **TIMING STRIKE:** A yellow marker travels left and right, increasing its pace. Tap when it aligns with the green target area. Each of ten shots awards 0–100 points based on distance to its centre; maximum 1,000 points. A 30-second upper time limit applies.
- **1 GEGEN 1 ARCADE / DUEL DASH:** Two players take turns on the *same device*, each for 20 seconds. They must tap the targets in a seeded, **identical** sequence; a streak of ten hits grants extra points. A handoff screen separates the turns and a result screen announces the winner or draw. This is **not real-time online multiplayer**; it requires neither a network opponent nor Firebase.

All four modes are available in the Android app and Flutter PWA, reuse existing optional audio/haptics and reduced-motion preferences, and keep independent device-only records or duel statistics. No new permissions, backend scoring, or global leaderboard changes were made. Sources: `lib/src/skill_rules.dart`, `lib/src/skill_page.dart`, `lib/src/duel_page.dart`; regression tests: `test/skill_modes_test.dart`.

## Skill Arcade: three additional local modes (November 2026)

All three are available from the **PLAY** tab on web and Android and share the current sound, volume, haptics and reduce-motion preferences. These are **local practice modes**: their records are stored on the current device/browser, never uploaded to Firebase and never mixed with the server-verified TAP BATTLE V2 leaderboard. Existing ranked and Random Hunt gameplay is unchanged.

- **BUBBLE RUSH:** a 30-second arcade round. Air-pocket bubbles appear at random locations; the interval drops progressively from **850ms to 230ms**. A bubble remains tap-able for **1.9–1.05s** depending on elapsed time. Successful pops have one of three new original bubble-pop WAV sounds. Five consecutive successful hits yield a two-point hit; unpopped bubbles and empty taps break the chain. Best score is highest points.
- **COLOR TRAP:** a 30-second visual-accuracy round. The target switches between randomly positioned **green** and **red** in progressively shorter intervals (**1000ms to 350ms**). Green +1; red −2; empty taps score 0. Best score is highest points.
- **REFLEX GO:** five independent trials with random wait times (**1.0–2.8s**) and an unexpected GO signal. Reaction time is captured from the GO display until pointer-down. Premature taps reset the wait and add **350ms** to the total; missed signals count as **2500ms**. The result is the five-trial average including penalties. **Lower is better**.

New game logic is in `lib/src/arcade_page.dart` and `lib/src/arcade_rules.dart`; local records live in `PracticeStore`. `test/arcade_modes_test.dart` covers acceleration, streak rewards, reaction penalties and persisted best scores. The modes do not need extra app permissions or backend changes.

## Arcade audio, combo feedback and optional permissions

- Seventeen **original, locally generated** PCM WAV effects live under `assets/audio/`: eight progressively brighter tap sounds, three new air-pocket pop variations, countdown, start, stop, miss, combo and record.
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

Use the existing Firebase project for Battle Tap with Email/Password enabled.
Register a Web app for the PWA and an Android app with package name
`ch.battletap.battle_tap` for the APK. For iOS, use the Firebase app registered
with bundle ID `ch.battletap.battleTap`. Set `FIREBASE_IOS_BUNDLE_ID` when
building with a different registered iOS bundle ID.

Copy the public Firebase client values from each app into `firebase/web.json`,
`firebase/android.json`, or `firebase/ios.json`, using the following keys.
The web app's `authDomain` goes in `FIREBASE_AUTH_DOMAIN` and can be omitted
for native builds. These files contain public SDK options. Keep service-account
keys and signing credentials outside the repository.

```json
{
  "FIREBASE_API_KEY": "YOUR_API_KEY",
  "FIREBASE_APP_ID": "YOUR_PLATFORM_APP_ID",
  "FIREBASE_SENDER_ID": "YOUR_MESSAGING_SENDER_ID",
  "FIREBASE_PROJECT_ID": "YOUR_PROJECT_ID",
  "FIREBASE_AUTH_DOMAIN": "YOUR_PROJECT_ID.firebaseapp.com"
}
```

GitHub Actions reads `firebase/web.json` for GitHub Pages and
`firebase/android.json` for the APK. For local builds, pass the matching file
to Flutter, for example `flutter run -d chrome --dart-define-from-file=firebase/web.json`.

Online profiles, friends and rankings need the existing Battle Tap backend deployed
to the same project. Verify the project ID and its Firestore configuration before
deploying. Run `npx -y firebase-tools@latest deploy --project PROJECT_ID --only functions,firestore`
from the repository. The client and Cloud Functions use `europe-west6` (Zurich).
Google and Apple sign-in require separate provider and platform configuration.

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
