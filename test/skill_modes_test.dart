import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battle_tap/src/skill_rules.dart';
import 'package:battle_tap/src/local_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Memory Matrix expands from 3x3 to 4x4 to 5x5 across 20 levels', () {
    expect(SkillMode.values, [SkillMode.memoryMatrix, SkillMode.timingStrike]);
    expect(SkillRules.memoryMaxLevel, 20);
    expect(SkillRules.memoryMaxLives, 3);
    expect(SkillRules.memorySteps(1), 2);
    expect(SkillRules.memorySteps(10), 11);
    expect(SkillRules.memorySteps(20), 21);
    expect(SkillRules.memoryPointsForLevel(3), 6);
    expect(SkillRules.memoryProgressPoints(0, 1), 1);
    expect(SkillRules.memoryProgressPoints(4, 1), 0);
    expect(SkillRules.memoryProgressPoints(4, 4), 0);
    expect(SkillRules.memoryProgressPoints(4, 5), 1);
    expect(() => SkillRules.memoryProgressPoints(-1, 1), throwsArgumentError);
    expect(SkillRules.memoryColumnsForLevel(1), 3);
    expect(SkillRules.memoryColumnsForLevel(7), 3);
    expect(SkillRules.memoryColumnsForLevel(8), 4);
    expect(SkillRules.memoryColumnsForLevel(14), 4);
    expect(SkillRules.memoryColumnsForLevel(15), 5);
    expect(SkillRules.memoryColumnsForLevel(20), 5);
    expect(SkillRules.memoryCellCount(8), 16);
    expect(SkillRules.memoryCellCount(15), 25);
    expect(SkillRules.memoryFlashInterval(20),
        lessThan(SkillRules.memoryFlashInterval(1)));
    expect(() => SkillRules.memorySteps(21), throwsRangeError);
    expect(() => SkillRules.memoryColumnsForLevel(0), throwsRangeError);
  });

  test('timing points bounded and shots gradually accelerate', () {
    expect(SkillRules.timingPoints(.5, .5), 100);
    expect(SkillRules.timingPoints(.5, .58), 50);
    expect(SkillRules.timingPoints(.1, .9), 0);
    expect(SkillRules.timingPeriodMs(9), greaterThanOrEqualTo(480));
  });

  test('both duel players receive exactly the same sequence', () {
    final first = SkillRules.duelTargets(123456);
    final second = SkillRules.duelTargets(123456);
    final different = SkillRules.duelTargets(654321);
    expect(first.length, SkillRules.duelTargetCount);
    expect(first, second);
    expect(first, isNot(different));
    expect(first.every((point) => point.x >= .14 && point.x <= .86 &&
        point.y >= .14 && point.y <= .86), true);
    expect(SkillRules.duelHitPoints(10), 3);
    expect(SkillRules.duelHitPoints(9), 1);
    expect(SkillRules.duelWinner(5, 5), isNull);
    expect(SkillRules.duelWinner(5, 4), 0);
    expect(SkillRules.duelWinner(4, 5), 1);
  });

  test('skill best scores, Memory level and duel stats stay local', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    expect(store.skillBest(SkillMode.memoryMatrix), isNull);
    expect(store.saveSkillRound(mode: SkillMode.memoryMatrix, score: 12,
        hits: 7, level: 3), true);
    expect(store.saveSkillRound(mode: SkillMode.memoryMatrix, score: 8,
        hits: 4, level: 2), false);
    expect(store.saveSkillRound(mode: SkillMode.timingStrike, score: 560,
        hits: 7), true);
    store.saveDuelMatch(firstScore: 14, secondScore: 16,
        firstHits: 12, secondHits: 14);
    expect(store.gamesPlayed, 5); // Three solo rounds and two duel turns
    expect(store.rankedRounds, 0);
    expect(store.rankedBest, 0);
    expect(store.memoryBestLevel, 3);
    expect(store.duelMatches, 1);
    expect(store.duelBest, 16);
    final restored = PracticeStore(prefs);
    expect(restored.skillBest(SkillMode.memoryMatrix), 12);
    expect(restored.skillBest(SkillMode.timingStrike), 560);
    expect(restored.memoryBestLevel, 3);
    expect(restored.duelMatches, 1);
    expect(restored.duelBest, 16);
    expect(restored.history.length, 5);
    store.dispose();
    restored.dispose();
  });
}
