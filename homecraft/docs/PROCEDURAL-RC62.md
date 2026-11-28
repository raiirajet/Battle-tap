# RC62 – NPC detail levels and mobile budget
- NPCs use three actual THREE.LOD slots, lazily created: full detailed avatar, medium existing avatar and a low-poly articulated silhouette for distance. Uses same resident identity, schedule and position. Player retains previous quality switching. Exact triangle budgets and visual continuity require measurement; this is not decimation of a single mesh.
- Medium quality uses measured FPS with hysteresis to lower/restore render resolution within the user preset; low/high/ultra remain explicit fixed settings. Resolution factor exposed in diagnostics. This is not a guaranteed 30 FPS.
- Dialogue framing recalculated on resize; player idle/look animation while speaking. Bush spacing and distance culling improved. No new collision obstacles; decorative foliage only.
- Production CI no longer requires optional GLB character artifacts; explicit npm run assets:export still available.
- New regression tests cover LOD selection, lazy allocation and adaptive resolution. Browser/Android validation pending.
