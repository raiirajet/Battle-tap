import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battle_tap/src/arcade_rules.dart';
import 'package:battle_tap/src/local_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Bubble Rush lasts 45 seconds, ramps every 5s and spawns more bubbles', () {
    expect(ArcadeMode.values.length, 3);
    expect(ArcadeRules.durationForMode(ArcadeMode.bubbleRush).inSeconds, 45);
    expect(ArcadeRules.durationForMode(ArcadeMode.reflexGo).inSeconds, 30);
    expect(ArcadeRules.bubbleStage(0), 0);
    expect(ArcadeRules.bubbleStage(4999), 0);
    expect(ArcadeRules.bubbleStage(5000), 1);
    expect(ArcadeRules.bubbleStage(40000), 8);
    expect(ArcadeRules.bubbleSpawnIntervalMs(0), 850);
    expect(ArcadeRules.bubbleSpawnIntervalMs(5000), 765);
    expect(ArcadeRules.bubbleSpawnIntervalMs(15000), 595);
    expect(ArcadeRules.bubbleSpawnIntervalMs(30000), 340);
    expect(ArcadeRules.bubbleSpawnIntervalMs(40000), 170);
    expect(ArcadeRules.bubbleMaxVisible(0), 6);
    expect(ArcadeRules.bubbleMaxVisible(40000), 17);
    expect(ArcadeRules.bubbleBurstSize(0), 1);
    expect(ArcadeRules.bubbleBurstSize(15000), 2);
    expect(ArcadeRules.bubbleBurstSize(30000), 3);
    expect(ArcadeRules.bubbleLifetimeMs(0), 1900);
    expect(ArcadeRules.bubbleLifetimeMs(40000), 1060);
    expect(ArcadeRules.colorSignalIntervalMs(30000), 350);
    expect(ArcadeRules.bubblePointsForStreak(4), 1);
    expect(ArcadeRules.bubblePointsForStreak(5), 2);
  });

  test('six Reflex colors always switch and only green/red affect points', () {
    expect(ReflexColor.values.length, 6);
    expect(ReflexColor.green.points, 1);
    expect(ReflexColor.red.points, -1);
    for (final color in ReflexColor.values) {
      if (color != ReflexColor.green && color != ReflexColor.red) {
        expect(color.points, 0);
      }
    }
    final rng = Random(12);
    ReflexColor? previous;
    for (var i = 0; i < 100; i++) {
      final next = ArcadeRules.nextReflexColor(rng, previous);
      expect(next, isNot(previous));
      previous = next;
    }
    expect(ArcadeMode.reflexGo.lowerIsBetter, false);
    expect(ArcadeMode.reflexGo.formatScore(15), '15 Punkte');
  });

  test('new Reflex point scores do not inherit old millisecond scores', () async {
    SharedPreferences.setMockInitialValues({
      'arcade_reflexGo_best_v1': 260,
    });
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    expect(store.arcadeBest(ArcadeMode.reflexGo), isNull);
    expect(store.saveArcadeRound(
      mode: ArcadeMode.reflexGo, score: 8, hits: 8), true);
    expect(store.arcadeBest(ArcadeMode.reflexGo), 8);
    expect(prefs.getInt('arcade_reflexGo_best_v1'), 260);
    expect(prefs.getInt('arcade_reflexGo_best_v2'), 8);
    store.dispose();
  });

  test('all local arcade scores persist separately from ranked scores', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    expect(store.saveArcadeRound(mode: ArcadeMode.bubbleRush, score: 22, hits: 18), true);
    expect(store.saveArcadeRound(mode: ArcadeMode.bubbleRush, score: 17, hits: 11), false);
    expect(store.saveArcadeRound(mode: ArcadeMode.colorTrap, score: -4, hits: 3), true);
    expect(store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 3, hits: 5), true);
    expect(store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 2, hits: 5), false);
    expect(store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 6, hits: 5), true);
    expect(store.gamesPlayed, 6);
    expect(store.totalHits, 47);
    expect(store.rankedRounds, 0);
    expect(store.rankedBest, 0);
    final restored = PracticeStore(prefs);
    expect(restored.arcadeBest(ArcadeMode.bubbleRush), 22);
    expect(restored.arcadeBest(ArcadeMode.colorTrap), -4);
    expect(restored.arcadeBest(ArcadeMode.reflexGo), 6);
    expect(restored.history.length, 6);
    store.dispose();
    restored.dispose();
  });
}
