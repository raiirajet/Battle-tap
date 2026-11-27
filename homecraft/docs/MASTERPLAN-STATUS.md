# HomeCraft 3D — masterplan status, 1.0.0-rc.17
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

## Roof phase 1 — RC2
Wall-supported thick roof shell, exterior room boundary extraction, asymmetrical overhangs, ridge axis, rise and knee-wall adjustments, parapet, materials, pyramid, chimney and preview. Irregular connected outlines supported for flat/shed and continuous gable/mansard/butterfly profile; independent intersecting ridges, courtyard and disconnected components remain open. Manual roof surfaces retain their explicit level-based elevations and override automatic roof unless replaced. No building engineering certification. RC APK version parsing corrected.

RC3: independent rectangular roof bodies and planar visible-surface clipping, touch picking, optional schematic rafters. Intersections are an upper envelope, not watertight volumetric CSG; body-specific openings and true structural members remain open.

RC4: individual body accessories, full shell cutouts, four adjustable vertical layers shown at exposed edges, ridge/valley/step profiles and optional eave drainage. No certified structural or watertight CSG, no physical Android verification.

RC5 phase 2: free polygon rooms, exact wall offset/split/parallel copies, room use/clear height/perimeter/volume and CSV, editable door/window models and frame geometry, stair count. Stair void remains rectangular footprint and arbitrary topology edits may require manual room metadata reassignment.

RC6: polygon slab voids, guarded walking at voids, railings, matched ceiling holes, net areas, split-level creation and explicit upper stair target, approximate sampled headroom. Physical QA and exact sloped roof/headroom calculations remain open.

RC7: nine parametrized architecture elements, configurable decks and roofed terraces, railings, facade panels, posts and beams, component-aware walk collision and geometric quantity CSV. Planning visualization only; no structural support calculation, code-compliant rail certification, or fully integrated stair landing geometry.

RC8: room-specific finish overlays, skirting, crown mouldings, ceiling lining and interior quantity CSV. No automatic mitred junctions, individual edge selection or structural lining design yet.

RC9: eleven kitchen module types, custom dimensions/fronts/worktops and handles, row builder, geometric warnings and module cost/mengen CSV. Legacy kitchen presets remain. No certified appliance installation, automatic corner joints or continuous custom worktop union.

RC10: eight configurable bathroom fixture types, component geometry including transparent shower screens, sanitary colours, fixture dimensions, mounting and clearance settings, editable fixture list and bathroom CSV. Existing bathroom templates remain. Clearance is a schematic rectangular check, not a building-code or plumbing certification. No automatic pipe routing or tile layout.

RC11: per-wall normalized facade rectangles on either face, individual colours and procedural material presets, opening clipping, net area and schematic elevations; wall splits retain sections. Glass is an opaque finish option, not glazing or a structural opening.

RC12: schematic route editor, user-defined diameter, material, cost per metre, start/end height, actual 3D length and slope, quantity summary and CSV. No sizing, cross-storey network topology, hydraulic calculations or installation certification.

RC13: detailed saved cost plan, geometry-derived quantities, individually priced kitchen/bath modules and routes, manual extras, waste, reserve, tax and target comparison. All rates user-entered; no live market prices, no tender or certified quantities. RC14 physical and signed-release QA remains open.

RC14: wall solid band sweep (fewer meshes with multiple openings), deduplicated scene disposal, pause hidden rendering, route ID and vertex-length checks, central facade/service warnings, isolated HomeCraft PR build and APK package/version gate. Existing project schema stays at 1. Full CI, physical Android upgrade and signed release are still separate acceptance gates.

RC15: bounded orthogonal room-centreline decomposition into automatically intersecting rectangular roof bodies, selected floor/axis/roof type, live plan preview, explicit replacement of that floor's existing bodies, and edit existing skylights/dormers/chimneys/solar panels. Manual roofs remain available. Suggestions are not exact exterior-wall offsets or certified structural junctions; courtyard, upper/lower-floor interfaces, nonorthogonal plans, and overhang overlaps need manual checking. Independent planner branch only; Valley merge deferred.

RC16: ordered wall material layers, configurable thickness and presets, section/3D display, wall-local strip foundations, quantities CSV, basement level with optional copied wall geometry and adjustable dimensions. Layer and foundation volumes are element sums, not junction-corrected union; basement single-floor 3D hides terrain for inspection, not excavation modelling. No load, soil, waterproofing or energy calculations. Complex stairs and CAD-grade junctions remain separate work.

RC17 first model pack: 42 distinct original procedural component models, catalog filter and deterministic projected thumbnails. No external downloaded assets; existing model IDs retained. 148 base models expected with legacy entries; target 795 remains open. Procedural shapes are planning-grade approximations, not photorealistic individually sculpted GLBs. No Valley edits.

RC17 second pack: 67 additional original recipes with 650 components. Separate filter for both model packs; 215 base IDs expected, 580 remaining toward target 795. Retains original version 1.0.0-rc.17 while iterating; geometry validation and browser regression added. No new GLB downloads or Valley changes.

RC17 third pack: 68 additional original recipes with 806 components, focused on wellness, outdoor kitchens, workshops, garage, furniture, plants and architectural accessories. 283 base IDs expected, 512 remaining. Separate pack filter and catalog regression tests; no Valley changes. Static planning geometry, no operational equipment simulation or structural certification.

RC17 fourth pack: 72 additional original recipes with 903 components, focused on playgrounds, recreation, premium living, transport, plants, retail/hospitality, office and architecture. 355 base IDs expected, 440 remaining. Separate filter and browser regression; no Valley changes. Static procedural planning objects, not certified playground equipment or animated vehicles.
