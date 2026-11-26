# HomeCraft 3D — masterplan status, 0.9.6
This is a release-candidate development branch, not a completed 1.0. A passing browser smoke test is not a physical Android test.
| Area | Implemented | Remaining validation or scope |
|---|---|---|
| Projects | IndexedDB, autosave, backup/restore, copies, variants, overlay | Multi-tab conflict protection, long-running device tests |
| Geometry | straight/segmented curved walls, planar face detection, dimensions, windows/doors, levels, slabs | robust arbitrary wall junction solids, nonrectangular intersections, stable room IDs |
| Stairs | straight, L, U, spiral treads, linked floor voids | headroom, exact voids, handrails, physical walk QA |
| Roof | six profiles and manually defined sloped polygon patches | automatic compound roof intersection and roof structural geometry |
| Terrain | polygon areas with two-axis slope | continuous sculpted heightfield, retaining walls and collision |
| 3D | real-time view, split, orbit, walkthrough, fly, x-ray, explosion, cameras | photorealistic offline rendering, animation/video and panorama |
| Catalog | 77 differentiated procedural base types and finish/size variants, imported GLB reuse | 795 individually authored high-quality models with asset-level QA and license provenance |
| Materials | 128 procedural presets, scale/rotation/side choices | scanned PBR textures and additional custom material import |
| Templates | 63 building variants and 30 room variants | individually authored architecture/layout QA |
| Interior | kitchen and bath assistants, room furnishing suggestion, object groups | accessibility and clearance validation |
| MEP | schematic paths and independent visibility | engineering sizing deliberately out of scope |
| Export | project JSON, backup, PDF, SVG, GLB, 1080p/4K PNG/JPG, CSV | high-res real-device memory tests; additional interchange formats and true video |
| Privacy | AES-GCM vault, passphrase lock, Android native strong biometric code | independent security review, physical biometric tests, storage migration tests |
| Delivery | Android debug and installable PWA CI, release signing workflow | owner-supplied stable signing key, successful release build and physical device test |
No building-code, structural, electrical or engineering certification. No cloud or external data required for core functionality. Do not label a build 1.0 until open release gates are resolved.
