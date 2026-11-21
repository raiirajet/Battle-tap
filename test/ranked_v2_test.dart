import 'package:flutter_test/flutter_test.dart';
import 'package:battle_tap/src/ranked_v2.dart';

void main() {
  test('combo requires five evenly spaced hits and does not count random taps', () {
    final combo = RhythmCombo();
    for (final t in [0, 130, 260, 390]) {
      combo.hit(t);
      expect(combo.combo, 0, reason: 'no combo until 4 matching intervals');
    }
    combo.hit(520);
    expect(combo.combo, 5);
    combo.hit(648); // small human timing jitter
    expect(combo.combo, 6);
    combo.hit(940); // substantial tempo change breaks the chain
    expect(combo.combo, 0);
    for (final t in [1010, 1190, 1280, 1510]) combo.hit(t);
    expect(combo.combo, 0);
    combo.reset();
    expect(combo.combo, 0);
  });

  test('rapid tapping without consistent rhythm never counts as combo', () {
    final combo = RhythmCombo();
    for (final t in [0, 110, 350, 465, 714, 825, 1090]) combo.hit(t);
    expect(combo.combo, 0);
  });

  test('diameter shrinks monotonically to a quarter at high speed', () {
    expect(RankedV2.diameterRatio([], 0), closeTo(.44, 1e-10));
    final slow = RankedV2.diameterRatio([100, 400, 700], 900);
    final faster = RankedV2.diameterRatio([for(var i = 0; i < 8; i++) i * 100], 800);
    final fastest = RankedV2.diameterRatio([for(var i = 0; i < 20; i++) i * 55], 1100);
    expect(slow, lessThanOrEqualTo(.44));
    expect(faster, lessThan(slow));
    expect(fastest, closeTo(.11, 1e-9));
    // A tap at 1200ms should not shrink the hitbox until it was accepted.
    expect(RankedV2.diameterRatio([0], 1300), closeTo(.44, 1e-9));
  });

  test('seeded positions match server and differ for each new seed', () {
    final first = RankedTargetPath(123456);
    final firstTarget = first.advance();
    expect(firstTarget.x, closeTo(.67960112368688, 1e-12));
    expect(firstTarget.y, closeTo(.1445808028941974, 1e-12));
    final secondTarget = first.advance();
    expect(secondTarget.x, closeTo(.18235831955913456, 1e-12));
    expect(secondTarget.y, closeTo(.6610491619398817, 1e-12));
    final same = RankedTargetPath(123456);
    expect(same.advance(), firstTarget);
    final different = RankedTargetPath(987654);
    expect(different.advance(), isNot(firstTarget));
  });

  test('target stays within the playable area after many moves', () {
    final path = RankedTargetPath(7890);
    for (var i = 0; i < 500; i++) {
      final previous = path.position;
      final target = path.advance();
      expect(target.x, inInclusiveRange(.07, .93));
      expect(target.y, inInclusiveRange(.07, .93));
      expect(previous.distanceTo(target), greaterThanOrEqualTo(.26));
    }
  });
}
