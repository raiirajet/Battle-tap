import 'dart:math';
import 'package:flutter_test/flutter_test.dart';
import 'package:battle_tap/src/rules.dart';

void main() {
  test('ranked always runs 30 seconds with 44 percent width', () {
    expect(BattleRules.rankedDuration, const Duration(seconds: 30));
    expect(BattleRules.rankedButtonWidthRatio, 0.44);
  });
  test('hunt random duration is in inclusive 18..60 range', () {
    final random = Random(17);
    for (var i = 0; i < 10000; i++) {
      final secs = BattleRules.huntDuration(random).inSeconds;
      expect(secs, inInclusiveRange(18, 60));
    }
  });
  test('ranked counts hits and never penalizes late taps', () {
    final round = RoundScore(BattleMode.ranked, BattleRules.rankedDuration);
    round.tap(elapsed: const Duration(milliseconds: 29999), hit: true);
    round.tap(elapsed: const Duration(seconds: 30), hit: true);
    round.tap(elapsed: const Duration(seconds: 31), hit: false);
    expect(round.score, 1);
    expect(round.lateTaps, 0);
  });
  test('random hunt loses two points for each late fresh tap', () {
    final round = RoundScore(BattleMode.hunt, const Duration(seconds: 18));
    for (var i = 0; i < 5; i++) {
      round.tap(elapsed: const Duration(seconds: 4), hit: true);
    }
    round.tap(elapsed: const Duration(milliseconds: 18000), hit: false);
    round.tap(elapsed: const Duration(milliseconds: 19000), hit: false);
    round.tap(elapsed: const Duration(milliseconds: 19999), hit: false);
    round.tap(elapsed: const Duration(seconds: 20), hit: false);
    expect(round.lateTaps, 3);
    expect(round.score, -1);
  });
  test('overlapping pointer events never count', () {
    final round = RoundScore(BattleMode.ranked, BattleRules.rankedDuration);
    round.tap(elapsed: const Duration(seconds: 1), hit: true, freshContact: false);
    expect(round.score, 0);
  });
  test('wrong taps score zero, accuracy measures hit share', () {
    final round = RoundScore(BattleMode.hunt, const Duration(seconds: 37));
    round.tap(elapsed: const Duration(seconds: 1), hit: true);
    round.tap(elapsed: const Duration(seconds: 2), hit: false);
    expect(round.score, 1);
    expect(round.accuracy, .5);
  });
}
