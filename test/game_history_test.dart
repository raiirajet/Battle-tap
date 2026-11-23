import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battle_tap/src/arcade_rules.dart';
import 'package:battle_tap/src/game_history.dart';
import 'package:battle_tap/src/local_store.dart';
import 'package:battle_tap/src/rules.dart';
import 'package:battle_tap/src/skill_rules.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('catalog contains all eight playable modes, not retired Precision Trail', () {
    expect(GameHistoryCatalog.keys, [
      'ranked', 'hunt', 'bubbleRush', 'colorTrap',
      'reflexGo', 'memoryMatrix', 'timingStrike', 'duel',
    ]);
    expect(GameHistoryCatalog.keys.contains('precisionTrail'), false);
    expect(GameHistoryCatalog.format('reflexGo', -4), '-4 Punkte');
  });

  test('history JSON tolerates corruption and round-trips player/level', () {
    expect(GameHistoryEntry.decode(null), isEmpty);
    expect(GameHistoryEntry.decode('{bad-json'), isEmpty);
    final when = DateTime.utc(2026, 11, 23, 18, 30);
    final entry = GameHistoryEntry(
      mode: 'duel', score: 42, hits: 38,
      when: when, player: 'Alex', verified: false,
    );
    final matrix = GameHistoryEntry(
      mode: 'memoryMatrix', score: 110,
      hits: 96, when: when, level: 12,
    );
    final decoded = GameHistoryEntry.decode(
      GameHistoryEntry.encode([entry, matrix]));
    expect(decoded.length, 2);
    expect(decoded[0].player, 'Alex');
    expect(decoded[0].score, 42);
    expect(decoded[1].level, 12);
    expect(decoded[0].when.toUtc(), when);
    expect(GameHistoryEntry.decode(
      '[{"mode":"precisionTrail","score":60,"hits":1,"at":"2026-11-23T00:00:00Z"}]'),
      isEmpty);
  });

  test('history records every finished local round and each duel player', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    final tap = RoundScore(BattleMode.ranked, const Duration(seconds: 30));
    tap.tap(elapsed: const Duration(seconds: 2), hit: true);
    store.savePracticeRound(tap);
    store.saveArcadeRound(mode: ArcadeMode.bubbleRush, score: 31, hits: 26);
    store.saveSkillRound(mode: SkillMode.memoryMatrix, score: 84,
      hits: 67, level: 11);
    store.saveDuelMatch(firstScore: 15, secondScore: 19,
      firstHits: 12, secondHits: 16,
      firstName: 'P1', secondName: 'P2');
    expect(store.history.length, 5);
    expect(store.bestForGame('bubbleRush'), 31);
    expect(store.bestForGame('memoryMatrix'), 84);
    expect(store.memoryBestLevel, 11);
    expect(store.bestForGame('duel'), 19);
    expect(store.history[0].player, 'P2');
    expect(store.history[1].player, 'P1');
    expect(store.history.last.mode, 'ranked');

    final restored = PracticeStore(prefs);
    expect(restored.history.length, 5);
    expect(restored.bestForGame('duel'), 19);
    expect(restored.history[0].player, 'P2');
    expect(restored.memoryBestLevel, 11);
    store.dispose();
    restored.dispose();
  });

  test('verified rounds enter only personal stats, no fake global best', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    final result = RoundScore(BattleMode.ranked, const Duration(seconds: 30));
    for (var i = 0; i < 20; i++) {
      result.tap(elapsed: const Duration(seconds: 2), hit: true);
    }
    store.saveVerifiedRound(result);
    expect(store.history.single.verified, true);
    expect(store.bestForGame('ranked'), 20);
    expect(store.verifiedRankedBest, 20);
    expect(store.rankedBest, 0);
    expect(store.rankedRounds, 1);
    final restored = PracticeStore(prefs);
    expect(restored.bestForGame('ranked'), 20);
    store.dispose();
    restored.dispose();
  });

  test('bounded 250-item history never erases persistent personal bests', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: 100, hits: 100);
    for (var i = 0; i < 300; i++) {
      store.saveArcadeRound(mode: ArcadeMode.reflexGo, score: i % 10, hits: 1);
    }
    expect(store.history.length, PracticeStore.maxHistoryEntries);
    expect(store.bestForGame('reflexGo'), 100);
    expect(store.history.first.score, 9);
    final restored = PracticeStore(prefs);
    expect(restored.history.length, PracticeStore.maxHistoryEntries);
    expect(restored.bestForGame('reflexGo'), 100);
    store.dispose();
    restored.dispose();
  });
}
