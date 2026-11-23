import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battle_tap/src/arcade_rules.dart';
import 'package:battle_tap/src/local_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('new modes have distinct local-only scoring rules', () {
    expect(ArcadeMode.values.length, 3);
    expect(ArcadeRules.bubbleSpawnIntervalMs(0), 850);
    expect(ArcadeRules.bubbleSpawnIntervalMs(15000), 540);
    expect(ArcadeRules.bubbleSpawnIntervalMs(30000), 230);
    expect(ArcadeRules.bubbleSpawnIntervalMs(45000), 230);
    expect(ArcadeRules.bubbleLifetimeMs(0), 1900);
    expect(ArcadeRules.bubbleLifetimeMs(30000), 1050);
    expect(ArcadeRules.colorSignalIntervalMs(30000), 350);
    expect(ArcadeRules.bubblePointsForStreak(4), 1);
    expect(ArcadeRules.bubblePointsForStreak(5), 2);
  });

  test('reflex average includes early-tap penalty and validates trials', () {
    expect(ArcadeRules.reactionAverageMs([200, 250, 300, 350, 400], 0), 300);
    expect(ArcadeRules.reactionAverageMs([200, 250, 300, 350, 400], 2), 440);
    expect(() => ArcadeRules.reactionAverageMs([300, 300], 0), throwsArgumentError);
  });

  test('local arcade best scores survive restart and never change ranked best', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    expect(store.arcadeBest(ArcadeMode.reflexGo), isNull);
    expect(store.saveArcadeRound(mode: ArcadeMode.bubbleRush, score: 22, hits: 18), true);
    expect(store.saveArcadeRound(mode: ArcadeMode.bubbleRush, score: 17, hits: 11), false);
    expect(store.saveArcadeRound(mode: ArcadeMode.colorTrap, score: -4, hits: 3), true);
    expect(store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 320, hits: 5), true);
    expect(store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 450, hits: 5), false);
    expect(store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 290, hits: 5), true);
    expect(store.gamesPlayed, 6);
    expect(store.totalHits, 47);
    expect(store.rankedRounds, 0);
    expect(store.huntRounds, 0);
    expect(store.rankedBest, 0);
    final restored = PracticeStore(prefs);
    expect(restored.arcadeBest(ArcadeMode.bubbleRush), 22);
    expect(restored.arcadeBest(ArcadeMode.colorTrap), -4);
    expect(restored.arcadeBest(ArcadeMode.reflexGo), 290);
    store.dispose();
    restored.dispose();
  });
}
