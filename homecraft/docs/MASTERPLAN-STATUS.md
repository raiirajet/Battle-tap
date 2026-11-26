# HomeCraft 3D — masterplan status, 1.0.0-rc.1
Release candidate for the implemented local-first planner. Not a claim of 100% completion of the original 38-section masterplan. The exact build and test result must be read from the HomeCraft Android/PWA workflow.

| Area | Implemented | Remaining limits / release gates |
|---|---|---|
| Projects | IndexedDB, autosave, backup/restore, variants, compare, revision CAS conflict detection, onboarding | browser/device crash recovery endurance and physical update tests |
| Precision | 2D drawing, connected vertices, dashed previews, linked dimensions, angle display, magnetic guides, loupe | stable associations after arbitrary topology changes; CAD-grade junctions |
| Architecture | four schematic elevations and X/Y cuts, SVG, geometric net/gross, renovation colors, basic project checker | certified drawings, exact solid CSG, SIA classification not implemented |
| Stairs | four types, linked floor voids and adjustable railings | headroom, exact voids, physical walkthrough QA |
| Roof | six automatic profiles, manual patches, basic skylights/dormers/solar/gutters/downpipes | automatic compound roofs; engineering validation |
| Site | parcel, height points, terrain mesh, geometric setbacks, fences/hedges/walls, parking, garden assistant | exact earthworks, grading, landscape engineering |
| 3D | orbit/split/walk/fly/xray/exploded/camera views, weather, reflection environment, contact shadows, image export | photorealistic path tracing, 360 panorama/video, physical performance QA |
| Catalog | 78 procedural base types and finish/size variants, GLB import/reuse, groups, mirror, align/repeat | 795 individually authored premium assets not complete |
| Materials | 128 procedural color/normal/roughness presets | photographic scans, custom material import |
| Templates | 63 building variants and 30 room variants, local furniture groups | individually authored architectural QA |
| MEP | schematic paths and visibility | sizing/certification out of scope |
| Export | JSON/backup, PDF/SVG/GLB, PNG/JPG HD/4K, CSV | DXF/SH3D, video/panorama, real-device memory QA |
| Privacy | AES-GCM vault, Android biometric implementation, revision conflict protection, stricter imports | independent security audit, physical biometrics, no stable signing key |
| Delivery | CI debug APK + offline PWA, manual signed release workflow | stable owner-controlled keystore; physical install/update and performance tests; workflow access on default branch |

No cloud required for core planning. No building-code or structural certification. The release candidate is a usable scope, not the final signed store release. Backup before uninstalling/debug signature changes. No claim that the original 795-model target or every future feature has been delivered.
