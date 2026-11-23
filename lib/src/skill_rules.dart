import 'dart:math' as math;

/// Skill-arcade modes are device-only; never submit these scores to Ranked V2.
enum SkillMode { memoryMatrix, precisionTrail, timingStrike }

extension SkillModeInfo on SkillMode {
  String get title => switch (this) {
    SkillMode.memoryMatrix => 'MEMORY MATRIX',
    SkillMode.precisionTrail => 'PRECISION TRAIL',
    SkillMode.timingStrike => 'TIMING STRIKE',
  };

  String get description => switch (this) {
    SkillMode.memoryMatrix => 'Merke dir die leuchtenden Felder in der richtigen Reihenfolge.',
    SkillMode.precisionTrail => 'Folge dem bewegten Lichtpunkt mit dem Finger.',
    SkillMode.timingStrike => 'Triff den Zielbereich mit perfektem Timing.',
  };

  String get unit => switch (this) {
    SkillMode.memoryMatrix => 'Punkte',
    SkillMode.precisionTrail => '% Genauigkeit',
    SkillMode.timingStrike => 'Punkte',
  };
}

abstract final class SkillRules {
  static const memoryMaxLevel = 10;
  static const memoryColumns = 3;
  static const precisionDuration = Duration(seconds: 30);
  static const timingAttempts = 10;

  /// First level shows two squares; each subsequent level adds one.
  static int memorySteps(int level) {
    if (level < 1 || level > memoryMaxLevel) {
      throw RangeError.range(level, 1, memoryMaxLevel, 'level');
    }
    return level + 1;
  }

  static int memoryPointsForLevel(int level) => memorySteps(level) + 2;

  static int trackingAccuracy(int trackedFrames, int totalFrames) {
    if (totalFrames <= 0) return 0;
    return ((trackedFrames / totalFrames) * 100).round().clamp(0, 100);
  }

  /// 100 points at the target centre; zero at 16% of the bar or further.
  static int timingPoints(double cursor, double target) {
    final diff = (cursor - target).abs();
    return (100 - (diff / .16 * 100).round()).clamp(0, 100);
  }

  /// Ten shots, progressively faster, but never too fast to visually track.
  static double timingPeriodMs(int shot) => math.max(480.0, 1250.0 - (shot * 75));

  /// Identical path and timer for both participants in pass-and-play.
  static const duelDuration = Duration(seconds: 20);
  static const duelTargetCount = 180;
  static const duelTargetRatio = .21;

  static List<math.Point<double>> duelTargets(int seed) {
    final rng = math.Random(seed);
    return List<math.Point<double>>.generate(duelTargetCount, (_) =>
        math.Point(.14 + rng.nextDouble() * .72,
            .14 + rng.nextDouble() * .72), growable: false);
  }

  static int duelHitPoints(int streak) => streak > 0 && streak % 10 == 0 ? 3 : 1;

  static int? duelWinner(int firstScore, int secondScore) {
    if (firstScore == secondScore) return null;
    return firstScore > secondScore ? 0 : 1;
  }
}
