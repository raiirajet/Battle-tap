import 'dart:math' as math;

/// Local-only skill games. These scores must never enter the verified
/// Tap Battle leaderboard or its Firebase session protocol.
enum ArcadeMode { bubbleRush, colorTrap, reflexGo }

extension ArcadeModeDetails on ArcadeMode {
  String get title => switch (this) {
    ArcadeMode.bubbleRush => 'BUBBLE RUSH',
    ArcadeMode.colorTrap => 'COLOR TRAP',
    ArcadeMode.reflexGo => 'REFLEX GO',
  };

  String get description => switch (this) {
    ArcadeMode.bubbleRush => 'Luftpolster platzen lassen – immer schneller!',
    ArcadeMode.colorTrap => 'Grün antippen. Rot vermeiden. Tempo steigt.',
    ArcadeMode.reflexGo => 'Schneller Farbwechsel: Grün +1, Rot −1, andere 0.',
  };

  String get instruction => switch (this) {
    ArcadeMode.bubbleRush => 'Platze so viele Blasen wie möglich. 5er-Serien geben Bonuspunkte.',
    ArcadeMode.colorTrap => 'Nur GRÜN zählt +1. ROT kostet 2 Punkte.',
    ArcadeMode.reflexGo => 'Immer neue Farben. Grün tippen gibt +1, Rot −1, alle anderen 0.',
  };

  // Reflex GO now awards color points instead of measuring milliseconds.
  bool get lowerIsBetter => false;
  String formatScore(int score) => '$score Punkte';
}

/// One signal is shown at a time; green scores, red penalises, other
/// colors are neutral. The next color always differs from the previous one.
enum ReflexColor { green, red, blue, purple, yellow, cyan }

extension ReflexColorInfo on ReflexColor {
  int get points => switch (this) {
    ReflexColor.green => 1,
    ReflexColor.red => -1,
    _ => 0,
  };
}

abstract final class ArcadeRules {
  static const Duration timedRound = Duration(seconds: 30);
  static const Duration bubbleRound = Duration(seconds: 45);
  static const int bubbleStageMs = 5000;
  static const int bubbleStageCount = 9;
  static const int reflexSignalIntervalMs = 850;
  static const int reflexTapCooldownMs = 140;

  static Duration durationForMode(ArcadeMode mode) =>
      mode == ArcadeMode.bubbleRush ? bubbleRound : timedRound;

  static int bubbleStage(int elapsedMs) =>
      (elapsedMs ~/ bubbleStageMs).clamp(0, bubbleStageCount - 1);

  /// 45 seconds with a distinct difficulty step every 5 seconds.
  static int bubbleSpawnIntervalMs(int elapsedMs) =>
      math.max(150, 850 - bubbleStage(elapsedMs) * 85);

  static int bubbleLifetimeMs(int elapsedMs) =>
      math.max(1050, 1900 - bubbleStage(elapsedMs) * 105);

  static int bubbleMaxVisible(int elapsedMs) =>
      math.min(17, 6 + bubbleStage(elapsedMs) * 2);

  static int bubbleBurstSize(int elapsedMs) =>
      bubbleStage(elapsedMs) >= 6 ? 3
        : bubbleStage(elapsedMs) >= 3 ? 2 : 1;

  static int colorSignalIntervalMs(int elapsedMs) =>
      math.max(350, 1000 -
          (650 * (elapsedMs / timedRound.inMilliseconds).clamp(0, 1)).round());

  static int bubblePointsForStreak(int streak) =>
      streak > 0 && streak % 5 == 0 ? 2 : 1;

  static ReflexColor nextReflexColor(math.Random rng, ReflexColor? previous) {
    final candidates = ReflexColor.values.where((c) => c != previous).toList();
    return candidates[rng.nextInt(candidates.length)];
  }
}
