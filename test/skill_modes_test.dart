import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battle_tap/src/skill_rules.dart';
import 'package:battle_tap/src/local_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('memory difficulty increases and is capped', () {
    expect(SkillRules.memorySteps(1), 2);
    expect(SkillRules.memorySteps(10), 11);
    expect(SkillRules.memoryPointsForLevel(3), 6);
    expect(() => SkillRules.memorySteps(11), throwsRangeError);
  });

  test('precision and timing scores are bounded', () {
    expect(SkillRules.trackingAccuracy(29, 40), 73);
    expect(SkillRules.trackingAccuracy(0, 0), 0);
    expect(SkillRules.trackingAccuracy(200, 100), 100);
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

  test('skill best scores and duel stats stay local and do not touch ranked', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = PracticeStore(prefs);
    expect(store.skillBest(SkillMode.memoryMatrix), isNull);
    expect(store.saveSkillRound(mode: SkillMode.memoryMatrix, score: 12,
        hits: 7), true);
    expect(store.saveSkillRound(mode: SkillMode.memoryMatrix, score: 8,
        hits: 4), false);
    expect(store.saveSkillRound(mode: SkillMode.precisionTrail, score: 78,
        hits: 0), true);
    expect(store.saveSkillRound(mode: SkillMode.timingStrike, score: 560,
        hits: 7), true);
    store.saveDuelMatch(firstScore: 14, secondScore: 16,
        firstHits: 12, secondHits: 14);
    expect(store.gamesPlayed, 6); // Four solo rounds and two duel turns
    expect(store.rankedRounds, 0);
    expect(store.rankedBest, 0);
    expect(store.duelMatches, 1);
    expect(store.duelBest, 16);
    final restored = PracticeStore(prefs);
    expect(restored.skillBest(SkillMode.memoryMatrix), 12);
    expect(restored.skillBest(SkillMode.precisionTrail), 78);
    expect(restored.skillBest(SkillMode.timingStrike), 560);
    expect(restored.duelMatches, 1);
    expect(restored.duelBest, 16);
    store.dispose();
    restored.dispose();
  });
}
