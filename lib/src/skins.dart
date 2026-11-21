import 'package:flutter/material.dart';

enum SkinRarity { standard, free, normal, epic, legend }

class BattleSkin {
  const BattleSkin(this.id, this.name, this.rarity, this.primary, this.secondary, this.description, this.style, {this.showcaseTier});
  final String id;
  final String name;
  final SkinRarity rarity;
  final Color primary;
  final Color secondary;
  final String description;
  final int style;
  /// Cosmetic effects can have EPIC/LEGEND quality while the skin is FREE.
  final SkinRarity? showcaseTier;
  SkinRarity get visualRarity => showcaseTier ?? rarity;
  bool get isFree => rarity == SkinRarity.standard || rarity == SkinRarity.free;
  BattleSkin withColors(Color newPrimary, Color newSecondary) =>
      BattleSkin(id, name, rarity, newPrimary, newSecondary, description, style,
        showcaseTier: showcaseTier);
  String get price => switch (rarity) {
    SkinRarity.standard || SkinRarity.free => 'FREE',
    SkinRarity.normal => 'CHF 0.90',
    SkinRarity.epic => 'CHF 2.90',
    SkinRarity.legend => 'CHF 5.90',
  };
  bool get isAnimated => visualRarity == SkinRarity.epic || visualRarity == SkinRarity.legend;
}

const skins = <BattleSkin>[
  BattleSkin('standard','Classic Tap',SkinRarity.standard,Color(0xFFCB2A3B),Color(0xFFFF6475),'Original Battle-Tap-Button',0),
  // Four permanently free premium-style cosmetic buttons; no payment required.
  BattleSkin('aurora_flux','Aurora Flux',SkinRarity.free,Color(0xFF167CE8),Color(0xFF80F7FF),
    'FREE · EPIC-style aurora rings',0, showcaseTier: SkinRarity.epic),
  BattleSkin('ember_storm','Ember Storm',SkinRarity.free,Color(0xFFCF3514),Color(0xFFFFB763),
    'FREE · EPIC-style flying fire embers',1, showcaseTier: SkinRarity.epic),
  BattleSkin('solar_halo','Solar Halo',SkinRarity.free,Color(0xFFB78213),Color(0xFFFFF1AF),
    'FREE · LEGEND-style orbiting solar light',0, showcaseTier: SkinRarity.legend),
  BattleSkin('night_nebula','Night Nebula',SkinRarity.free,Color(0xFF3A248A),Color(0xFFB483FF),
    'FREE · LEGEND-style cosmic spiral',4, showcaseTier: SkinRarity.legend),
  BattleSkin('red_strike','Red Strike',SkinRarity.normal,Color(0xFFAA1625),Color(0xFFFF626D),'Red high-gloss',0),
  BattleSkin('ocean_blue','Ocean Blue',SkinRarity.normal,Color(0xFF1154BB),Color(0xFF62C5FE),'Deep-blue glass',1),
  BattleSkin('toxic_green','Toxic Green',SkinRarity.normal,Color(0xFF16913F),Color(0xFFB8FF54),'Intense fresh green',2),
  BattleSkin('royal_purple','Royal Purple',SkinRarity.normal,Color(0xFF6122B3),Color(0xFFE0A3FF),'Royal violet metal',3),
  BattleSkin('golden_yellow','Golden Yellow',SkinRarity.normal,Color(0xFFC18A07),Color(0xFFFFED68),'Warm golden reflection',4),
  BattleSkin('neon_pulse','Neon Pulse',SkinRarity.epic,Color(0xFF08B2C7),Color(0xFF6EFFFF),'Pulsating neon cyan',0),
  BattleSkin('inferno_core','Inferno Core',SkinRarity.epic,Color(0xFFE0441D),Color(0xFFFFC15A),'Molten burning core',1),
  BattleSkin('plasma_venom','Plasma Venom',SkinRarity.epic,Color(0xFF34C728),Color(0xFFCDFF58),'Living plasma energy',2),
  BattleSkin('thunder_violet','Thunder Violet',SkinRarity.epic,Color(0xFF8E3AE6),Color(0xFFF6B8FF),'Purple lightning arcs',3),
  BattleSkin('frozen_prism','Frozen Prism',SkinRarity.epic,Color(0xFF31A5CF),Color(0xFFDEFFFF),'Shimmering ice crystal',4),
  BattleSkin('solar_deity','Solar Deity',SkinRarity.legend,Color(0xFFB87A09),Color(0xFFFFF1A7),'Orbiting golden suns',0),
  BattleSkin('void_dragon','Void Dragon',SkinRarity.legend,Color(0xFF5B18A7),Color(0xFFDC54FF),'Violet dragon-fire vortex',1),
  BattleSkin('phoenix_heart','Phoenix Heart',SkinRarity.legend,Color(0xFFC42B09),Color(0xFFFFCE50),'Rising phoenix embers',2),
  BattleSkin('celestial_crown','Celestial Crown',SkinRarity.legend,Color(0xFF326CB4),Color(0xFFFFDF8E),'Crystal crown and aurora',3),
  BattleSkin('cosmic_singularity','Cosmic Singularity',SkinRarity.legend,Color(0xFF372E88),Color(0xFF8BF7FF),'Rotating miniature galaxy',4),
];

BattleSkin skinById(String id) {
  for (final skin in skins) {
    if (skin.id == id) return skin;
  }
  return skins.first;
}
