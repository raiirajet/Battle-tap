# CROWNFALL — Rise of Realms | 0.1-alpha
Independent offline vertical slice based on GDD 1.1, 26 November 2026. Battle Tap is unchanged.
- PWA: serve web/ over HTTPS or localhost (python3 -m http.server 8080 --directory web). Generate icons with python3 tools/icons.py web.
- Android: GitHub Actions "Crownfall standalone builds" creates a debug APK (ch.crownfall.game) with the same offline web assets. Locally: generate icons, then gradle -p android assembleDebug with JDK 17, SDK 35, Gradle 8.9.
- Tests: node --test tests/*.test.mjs.
- The PWA build is downloadable and must be hosted independently or under /Battle-tap/crownfall/ after a coordinated Pages deployment. No existing production workflow or backend modified.

Implemented: guest Kingdom, fixed small Sylvaris map, six buildable types, construction, worker allocation, food/water/wood/stone/knowledge, housing, militia/scout training, training battle, one hero (Aldric/Elara), local save, single tutorial reward, offline app shell. Original procedural vector graphics.
Simplifications: no pathfinding or physical goods yet (direct delivery), 24x24 map instead of 64/128, no economy crises/health/morale system beyond a simple combat modifier, no multiplayer, no full tech tree/campaign, no server/accounts, no full asset bible. Initial spring supplies 20 water/min until a well is built; construction has one automatically reserved builder. Native WebView wrapper, plain JS and Canvas rather than final Phaser/React/TypeScript/Capacitor architecture; localStorage rather than IndexedDB. Not a 1.0 release or empirically balanced. Android debug build, not store-signed.

## 0.2 expanded offline alpha
Full GDD building, technology, unit and hero stat catalogues and 120 achievement thresholds. Not all catalogue entries have mechanics; unsupported research is explicitly disabled. See docs/GDD-coverage.md. New age/research queues, storage, upgrades, direct-delivery recipes, taxes/health/satisfaction, seasons, local market, rudimentary NPC treaty, deterministic expeditions, private achievements, speed control, expanded 48x48 play area. Existing saves are extended on load. No public deployment or online game server.
