# GDD 1.1 coverage — alpha 0.3, not release approval
Source: Crownfall Game Design Document v1.1, 65 pp.
| Pages | Area | Status |
|---|---|---|
| 1–7 | Vision, modes, founding, tutorial | Partial: offline Kingdom/tutorial, names and culture. Other modes absent. |
| 8–9 | Seed maps, six regions, culture | Partial: fixed Sylvaris map 48x48, six cultural names and elite restrictions; no procedural terrain, cultural art, coats of arms or ranked. |
| 10–12 | Economy, logistics, building | Partial: storage, concurrent construction, upgrades, demolition, recipes and direct delivery; walkable path grid, road placement and cancellation refunds now implemented; no finite sources, physical transport, repairs or reserved materials per cycle. |
| 13–16 | 56 buildings | Full data; most placeable with age locks; province/wonder intentionally disabled, several effects not implemented. |
| 17–18 | Society, seasons | Partial: taxes, health, satisfaction, speed, seasons; no individual needs, local water radius, crises, road network. |
| 19–24 | Ages and 60 technologies | Full data, additional road research effects and prerequisites enabled; disabled technologies prevent some later branches; age III–V rules not fully playable. No claim of full progression. |
| 25–32 | Heroes, abilities, talents | 12 selectable templates, six stat classes; only warlord Sammelruf implemented. No inventory or talent trees. |
| 33 | Dynasty | Minimal succession action; legacy proxy only; no full lineage, government, equipment inheritance. |
| 34–37 | Units and combat | Full 24 stat rows, age/building/gear gates; existing simplified tutorial battle, scout BFS and discovery now implemented; no tactical army pathfinding, formations, sight, naval combat, full counters. |
| 38–40 | Provinces, trade, expeditions | Partial: local market, simplified NPC contract, six seeded expedition jobs; no independent provincial economy, real routes, loot or crisis events. |
| 41–45 | Campaign | 40 mission records and ordered, one-time local rewards for implemented goals in chapters I–II plus selected later goals. Separate Campaign saves; unfinished objectives explicitly marked, not fully playable through chapter V. |
| 46 | Endgame | Partial private counters; ten local save slots, versioned text export/import; no wonder phases or prestige. |
| 47–49 | Online/coop | Not implemented. |
| 50–53 | UX/assets/audio/AI | Basic responsive UI and original vector visuals; no finished asset set, sound or AI. |
| 54–57 | Architecture/backend | JS/Canvas/WebView local-only; no prescribed server, deterministic 10 Hz, DB or network security. |
| 58–61 | QA/release/monetization | CI tests/build only; unsigned development APK; no monetization. |
| 62–63 | Gear | Recipe goods, not the 32-item equipment inventory. |
| 64–65 | Achievements | 120 thresholds, private local awards; some categories have no producers; full anti-repeat and public verification absent. |

## Visual bible v1.0 / 0.4
- pp. 3–8, 15–20, 25: procedural figure descriptors for 12 heroes, 24 military/transport units, 8 worker roles. Not exact previsualization meshes.
- p. 21: walk/run limb cycles with fixed-step displacement and eight-way heading; no FPS-driven motion.
- pp. 22–24: animated worker poses only; full combat, defeat and ability animation events not yet implemented.
- p. 30: live polygon renderer, no GLB or sprite atlas. No certified mobile FPS or device-level visual acceptance yet.
