# BATTLE TAP — Game Design Document v1.1
**Date:** 21 November 2026  
**Platforms:** Android + iOS | **Stack:** Flutter, Flame, Firebase  
**Positioning:** Fast arcade reaction game, global competitive rankings, cosmetic-only shop.

## Locked rules

- **TAP BATTLE:** 30.00 seconds; one circular, stationary, centered button; exact diameter **44% of logical screen width**; each valid new pointer contact +1. No held-button auto-repeat and no simultaneous multi-touch double scoring. Wrong or expired touches score 0.
- **RANDOM HUNT:** New random round duration from **18 to 60 seconds**, visible decreasing timer. Button is smaller (initial design: 22% screen width), spawns within the safe gameplay area, immediately relocates on each valid hit, otherwise relocates after approximately **1.0 second** without a valid hit. Wrong taps score 0; hits +1.
- **STOP:** At 0.00 the hunt button disappears; STOP warning + sound + red warning; next 2 seconds each fresh tap anywhere in the game field incurs **−2**; afterward input is ignored. Negative final scores are allowed.
- **Ranking eligibility:** **TAP BATTLE only**, authenticated and verified via server session. The random mode stores personal statistics, never public scores.
- **Rule changes:** Competition-relevant constants must be versioned; existing verified historical scores must not be reinterpreted silently.

## Pages and user journeys

1. **PLAY:** logo, nickname and country flag, personal best, world rank, large cards for both modes, relevant friend challenges.
2. **TAP BATTLE:** ready screen, 3–2–1 countdown, fixed button, 30-second timer, current score, personal best, verified results with global/country/friends ranks, retry and rankings buttons.
3. **RANDOM HUNT:** ready screen, randomized visible timer, small moving button, live score, STOP-phase penalty feedback, result summary (hits, misses, delayed taps, time, hit rate, taps/second, personal best).
4. **RANKS:** Global, Country and Friends; All Time and Weekly; 100 leaders plus personal place; weekly reset Mondays 00:00 UTC; ties broken by earlier achievement time.
5. **SHOP:** Normal, Epic, Legend; each offers active animation preview, own price, ownership and equip; checkout through Play Billing / StoreKit, receipt verified by server.
6. **FRIENDS:** search nickname or Battle Tag, send/accept/block, view profiles, friend ranking, asynchronous score challenges.
7. **PROFILE:** sign-in (Google / Apple / email), nickname and 2-letter country code, battle tag, record history, achievements, privacy/settings, restore purchases, account deletion.

## Cosmetics — exactly 15 purchasable skins

### NORMAL (suggested CHF 0.90)
Red Strike (bright red high gloss); Ocean Blue (deep glass blue); Toxic Green (bright green); Royal Purple (violet metallic); Golden Yellow (sunlit yellow). Simple 3D-like press effect; no gameplay advantage.

### EPIC (suggested CHF 2.90)
Neon Pulse (cyan glow pulses); Inferno Core (warm fire embers); Plasma Venom (animated green filaments); Thunder Violet (purple electrical bolts); Frozen Prism (ice-blue crystals). Each must have distinct animated motifs, colors and glow.

### LEGEND (suggested CHF 5.90)
Solar Deity (gold rotating sun rings and rays); Void Dragon (magical purple flames); Phoenix Heart (flowing flame feathers); Celestial Crown (levitating crystal diamond fragments); Cosmic Singularity (rotating galaxy/stars). Multi-layer animations with soft-device fallback; hitboxes remain identical.

## Golden Splash record effect

On **verified new TAP BATTLE personal best**, show 3-second full-screen gold splash: large NEW RECORD text, liquid-like gold jets from sides, drifting drops and waves, gold confetti, score and updated placement; skip affordance and reduce-motion support. A separate stronger world-record effect is planned. In unconfigured offline practice, this animation is explicitly marked a preview rather than a verified competition event.

## Fair play and data

- Server starts sessions, issues IDs, validates submissions and writes verified scores; clients cannot directly write ranked collections.
- Authenticated players have IDs, nicknames, country codes, battle tags, personal stats, skin entitlements and friend links; public profile never reveals e-mail.
- Both weekly and all-time rankings are shared across iOS and Android.
- Device attestation, automation detection, upload throttles, session freshness and administrator review are required for public anti-cheat safety. No perfect anti-cheat guarantee.
- Country switches are rate limited; friend requests require consent; report/block and account deletion are mandatory before store release.
- Purchase receipts verified on backend; skins are cosmetics only. No loot boxes, no competitive boosts.

## Technical model

Flutter app (Flame enabled for eventual effects/game component layer) + Firebase Authentication + Firestore + HTTPS Callable Cloud Functions + Crashlytics/Remote Config planned. Data collections: `users`, `battleTags`, `sessions`, `rankedBest`, `rankedWeekly`, `friendships`, `challenges`, `ownedSkins`, `purchases`, `playerStatistics`, `achievementProgress`, `securityFlags`. Only the trusted backend writes ranked and entitlements.

## Acceptance matrix

| Check | Required |
|---|---|
| Ranked button | diameter is 44% logical device width; fixed center, safe area |
| Ranked time | 30.00 seconds, no score afterward |
| Hunt duration | all rounds between 18 and 60 seconds inclusive; visible countdown |
| Hunt relocation | immediately after hit, after ~1.0s without a hit |
| Hunt penalty | exactly −2 on each fresh touch in 2s STOP window |
| Score integrity | holding and overlapping touches do not grant extra points |
| Verified ranks | only valid ranked sessions enter global/country/friend boards |
| Skin fairness | no visual skin changes the hitbox |
| Ownership | every paid skin requires verified store purchase, restore works |
| Record celebration | verified personal record triggers golden splash |
| Accounts | registration, restore, change country, delete, all functional |
| Release | physical Android and iOS tests, no critical issues, legal metadata supplied |

## Work packages / completion criteria

1. **Foundation:** Flutter/Flame/Firebase repository and CI baseline.
2. **Identity:** mandatory online account, recovery and profile management.
3. **Ranked:** authoritative 30s interaction and verified outcome.
4. **Random Hunt:** stable random timer, moving small target and STOP penalties.
5. **Ranking:** global, country, friend, all-time, weekly with correct tie order.
6. **Friends:** request, accept, block, friend scores, asynchronous challenges.
7. **Shop:** 15 skins + billing + real entitlement and restoration.
8. **Effects:** golden splash, sounds, high-performance skin particles.
9. **Administration:** analytics, achievements, integrity and moderation.
10. **Release:** full device tests, review compliance, signing and deployment.

**Do not misinterpret the current repository scaffold as acceptance of all 10 work packages.** Refer to the implementation status in the root README.
