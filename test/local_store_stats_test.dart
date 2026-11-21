import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battle_tap/src/local_store.dart';
import 'package:battle_tap/src/rules.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('lifetime taps migrate old successful-tap baseline and persist attempts', () async {
    SharedPreferences.setMockInitialValues({
      'practice_hits': 21, 'practice_games': 3,
    });
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    expect(store.gamesPlayed, 3);
    expect(store.totalTaps, 21);
    store.registerTap();
    store.registerTap(); // includes a miss even if round is abandoned
    store.flushTapCount();
    expect(prefs.getInt('lifetime_total_taps'), 23);
    final restored = PracticeStore(prefs);
    expect(restored.totalTaps, 23);
    store.dispose();
    restored.dispose();
  });

  test('separate weighted average speed for hunt and tap battle', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    final hunt = RoundScore(BattleMode.hunt, const Duration(seconds: 20));
    for (var i = 0; i < 40; i++) {
      hunt.tap(elapsed: const Duration(seconds: 2), hit: true);
    }
    store.savePracticeRound(hunt);
    expect(store.huntRounds, 1);
    expect(store.gamesPlayed, 1);
    expect(store.huntAverageSpeed, closeTo(2.0, .0001));
    expect(store.rankedAverageSpeed, 0);

    final ranked = RoundScore(BattleMode.ranked, const Duration(seconds: 30));
    for (var i = 0; i < 90; i++) {
      ranked.tap(elapsed: const Duration(seconds: 2), hit: true);
    }
    store.saveVerifiedRound(ranked);
    expect(store.rankedRounds, 1);
    expect(store.rankedAverageSpeed, closeTo(3, .0001));
    expect(store.gamesPlayed, 2);
    expect(store.rankedBest, 0); // online scores do not fake a local record

    final restored = PracticeStore(prefs);
    expect(restored.gamesPlayed, 2);
    expect(restored.huntAverageSpeed, closeTo(2, .0001));
    expect(restored.rankedAverageSpeed, closeTo(3, .0001));
    store.dispose();
    restored.dispose();
  });

  test('new premium-look free skins equip immediately without purchase', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    store.equip('solar_halo');
    expect(store.equippedSkinId, 'solar_halo');
    store.equip('solar_deity'); // paid, purchase verification unavailable
    expect(store.equippedSkinId, 'solar_halo');
    store.equip('night_nebula');
    expect(store.equippedSkinId, 'night_nebula');
    final restored = PracticeStore(prefs);
    expect(restored.equippedSkinId, 'night_nebula');
    store.dispose();
    restored.dispose();
  });
}
