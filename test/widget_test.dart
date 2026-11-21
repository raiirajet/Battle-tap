import 'package:flutter_test/flutter_test.dart';
import 'package:battle_tap/src/rules.dart';
import 'package:battle_tap/src/skins.dart';

void main() {
  test('all 15 purchasable skins plus a free standard skin exist', () {
    expect(skins.length, 16);
    expect(skins.where((e) => e.rarity == SkinRarity.normal).length, 5);
    expect(skins.where((e) => e.rarity == SkinRarity.epic).length, 5);
    expect(skins.where((e) => e.rarity == SkinRarity.legend).length, 5);
    expect(skins.first.id, 'standard');
  });
  test('the countdown in random hunt is always visible', () {
    expect(BattleRules.huntCountdownVisible, true);
    expect(BattleRules.huntMoveInterval, const Duration(seconds: 1));
    expect(BattleRules.lateTapPenalty, 2);
  });
}
