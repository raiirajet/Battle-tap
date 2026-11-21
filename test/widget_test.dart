import 'package:flutter_test/flutter_test.dart';
import 'package:battle_tap/src/rules.dart';
import 'package:battle_tap/src/skins.dart';

void main() {
  test('original 15 paid skins preserved and four new free premium skins added', () {
    expect(skins.length, 20);
    expect(skins.where((e) => e.rarity == SkinRarity.normal).length, 5);
    expect(skins.where((e) => e.rarity == SkinRarity.epic).length, 5);
    expect(skins.where((e) => e.rarity == SkinRarity.legend).length, 5);
    expect(skins.where((e) => e.rarity == SkinRarity.free).length, 4);
    expect(skins.where((e) => e.isFree).length, 5);
    expect(skins.first.id, 'standard');
    final epics = skins.where((e) =>
      e.rarity == SkinRarity.free && e.visualRarity == SkinRarity.epic);
    final legends = skins.where((e) =>
      e.rarity == SkinRarity.free && e.visualRarity == SkinRarity.legend);
    expect(epics.length, 2);
    expect(legends.length, 2);
    expect(skinById('night_nebula').price, 'FREE');
    expect(skinById('solar_halo').isAnimated, true);
    expect(skinById('solar_deity').price, isNot('FREE'));
  });

  test('recoloring hunt skin preserves its rarity and animation family', () {
    final original = skinById('night_nebula');
    final tinted = original.withColors(original.secondary, original.primary);
    expect(tinted.id, original.id);
    expect(tinted.visualRarity, original.visualRarity);
    expect(tinted.primary, original.secondary);
    expect(tinted.secondary, original.primary);
  });

  test('the countdown in random hunt is always visible', () {
    expect(BattleRules.huntCountdownVisible, true);
    expect(BattleRules.huntMoveInterval, const Duration(seconds: 1));
    expect(BattleRules.lateTapPenalty, 2);
  });
}
