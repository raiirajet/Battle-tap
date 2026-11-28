# HomeCraft 3D - Park asset library v1

## Delivery
- 38 real GLB files, 4.1 MB uncompressed, in four ZIPs under artifacts/park; metadata in manifest.json. 10 vegetation families with LOD0/1/2.
- Original deterministic geometry, no downloaded or external models. Regenerate with npm run assets:park from homecraft. This writes public/assets/park. Build and dev run it automatically; the existing offline cache enumerates dist including these models.
- The separate Vite page park-preview.html loads the actual GLBs and provides eye-level/overview, sun/cloud, and individual asset inspection. Run npm install and npm run dev from homecraft, then open /park-preview.html. This is an independent sample park, not an identical camera comparison with the existing world.
- Ground and asphalt use 128px embedded procedural base-color (sRGB), normal and metallic-roughness maps (linear G roughness, B metallic). Other materials use factors, with emissive lamp surface. No mesh compression or online dependencies for these models.
- Existing character builder is extended with named Lea and player LOD1 exports based on the current profile and rig; the character geometry is not newly sculpted. Build must run before these files exist.

## Integration boundary
Live park centre remains (288,346). Existing navigation, plot access, NPC profile, collision and dialogue unchanged. Candidate mappings: valley-art-world.js grassClump/meadowArt -> park_grass variants, valley-scene.js park treePositions -> trees with LOD, terrainScenery -> road details, villageArt -> lamps, town architecture -> facade pieces. Do not overlap old and new visuals; only swap after asset loading, keep old meshes on error. No automatic runtime replacement in this branch.

## Outstanding
Visual review in the Three.js target renderer; compare original park with identical camera and lighting; real scene placement and collision checks; vegetation wind and distance LOD switching in runtime; 512-1K material textures and other object PBR maps; house front is decorative, door not functional; lowered curbs, wet surfaces, lamp light pool; full character LOD0/2, textile textures, skinning and gesture validation; live conversation regression; Android FPS/size/offline and APK. Header/range/LOD checks only, not Khronos glTF validation or device QA. All models are an initial procedural art pass, not final semi-realistic production art.
