# D3 — Ortskern und Bewohner (erste spielbare Ausbaustufe)
- Sechs namentliche Bewohner, drei dekorative Nachbarhäuser westlich der Strasse, unterschiedliche Arbeitsorte und versetzte Tagesrouten. Positionen deterministisch aus Spielzeit, mit animierten 3D-Figuren. Häuser sind nicht betretbar.
- Bewohner in 2,4 m Reichweite ansprechen, Begrüssen (+3) oder Unterhalten (+8), 30 Sekunden Echtzeit-Pause je Person. Bekanntschaften 0–100 im bestehenden IndexedDB-Spielstand, validiert bei Import, alte Saves ohne Beziehungen kompatibel. Keine Online-Spieler.
- Werkstatt 08:00–18:00, Markt 07:00–20:00 Spielzeit. Menü zeigt Status; Speicherung lehnt geschlossene Transaktionen ab. Arbeitsbeginn vor Schliessung ist zulässig.
- Vier prozedurale Autos fahren auf getrennten Ost-West-Strassen mit zwei Spuren und Wendepunkten. Kein fahrbarer Spielerwagen, keine Ampeln, keine Verkehrsphysik oder Fahrzeugkollision; Bewohner sind ebenfalls nicht physisch kollidierende Figuren. Tagesrouten sind vordefiniert, keine freie KI-Navigation. Bei Sprüngen der Spielzeit ändern sich Positionen entsprechend.
- Sandbox: sichtbare Bewohner und Fahrzeuge, aber keine sozialen oder wirtschaftlichen Aktionen; Uhr bleibt wie zuvor fix. Keine Wetter-/Jahreszeitenerweiterung.
- Unit-Tests für Uhrzeiten, Routen, Beziehungen, alte Spielstände und Standortschutz. Browser-/Android-Geräteabnahme steht aus.
