# HomeCraft Valley – A+B Entwicklungsstand

Basis: Masterplan vom 27.11.2026, Kapitel 03–09 und 17–23.
Bestehender Stack: Three.js 0.170, Vite, Capacitor Android. Der Planer bleibt unverändert bis auf Einstieg und Zurück-Navigation. Spielland nutzt eine getrennte IndexedDB. Keine Projektinhalte werden in den Spielstand kopiert; die vorhandene Planer-Verschlüsselung gilt nicht für die separate Spielland-Datenbank.

## Inhalt
- 1024 × 1024 m, 256 logische 64-m-Chunks; zusammengeführtes Terrainmesh mit 8 Segmenten pro Chunk, deterministische Höhen.
- 16 rechteckige, getrennte Reserven; 20 × 25 m Startland, 40 × 50 m Reserve, fixe Front; 3 m vorne, 2 m sonst.
- Verbundener Strassengraph, Gehwege, Park, schematische Ortskerngebäude, See, instanzierte Bäume, Tageslicht. Eigenständig erzeugte primitive Meshes (keine externen Assets).
- Lokale Spielstände ohne Anmeldung, 25'000 HC, 50 HC/m², atomare IndexedDB-Transaktion für Fläche, Wallet und Ledger. Angebotsrevision und Vorgangs-ID, Wiederholungsprüfung. Import validiert Journal und Geometrie; vorhandene Spielstände werden nicht überschrieben.
- Touch-/Mauskamera, Parzellenwahl, gestrichelte Erweiterungsvorschau, Bestätigung, sichtbares Restguthaben, Journal und JSON-Sicherung. Kauf über ganze Meter per Eingabefeld statt Ziehen.
- Keine Echtgeldgebühren. Lebensmodus/Sandbox sind für spätere Phasen gespeicherte Spieltypen, noch keine Lebenssimulation.

## Test und Build
Im Verzeichnis homecraft: npm install, npm test, npm run dev oder npm run build.
Der bestehende Android/PWA-Workflow wird durch Push auf homecraft-3d ausgelöst. Unit-Tests in test/valley.test.js; zusätzlich lokaler Test der Kernfunktionen beim Erstellen. Browser-/Android-Abnahme und Crash-Tests sind noch nicht bestätigt.

## Offene Punkte (keine vollständige Definition of Done)
Dynamisches Chunk-Streaming/LOD, nahtlose Materialübergänge, detaillierte Wasser-/Fussgänger-Kollision, vollständige Assetliste und LOD/Kollisionsprofile, detaillierte Map-UI, Drag-Erweiterung, gespeicherte Kamera, echte Migration früherer Weltversionen, native Backup-Freigabe, Wiederherstellung über vorhandenen beschädigten Save, IndexedDB-E2E und Geräteprofiling. Die 3D-Darstellung ist stilisiert/prozedural und kein fertiges semi-realistisches Assetpaket.
Phase C: Adapter aus Projektmodell (levels, walls, openings, roofBodies/roofPatches, objects, stable IDs), unveränderliche Revision mit Meterkoordinaten (Planer x/y → Welt x/z, Geschosshöhe → y), Grundriss/Dachhülle, Eingangsanker und abgeleitete Kollisions-/Navmesh-Daten. Noch keine Platzierung, kein Referenzhaus-Mock und keine Hausintegration.
Phase D: Avatar, Pfadfindung, Interaktionen, Zeit, Bedürfnisse, Einkommen; nicht implementiert.
