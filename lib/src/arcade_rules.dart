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
    ArcadeMode.reflexGo => 'Warte auf GO! – fünf Reaktionstests.',
  };

  String get instruction => switch (this) {
    ArcadeMode.bubbleRush => 'Platze so viele Blasen wie möglich. 5er-Serien geben Bonuspunkte.',
    ArcadeMode.colorTrap => 'Nur GRÜN zählt +1. ROT kostet 2 Punkte.',
    ArcadeMode.reflexGo => 'Tippe erst bei GO! Frühstarts geben +350 ms Strafzeit.',
  };

  bool get lowerIsBetter => this == ArcadeMode.reflexGo;
  String formatScore(int score) => lowerIsBetter ? '$score ms' : '$score Punkte';
}

abstract final class ArcadeRules {
  static const Duration timedRound = Duration(seconds: 30);
  static const int reactionTrials = 5;
  static const int falseStartPenaltyMs = 350;
  static const int reactionTimeoutMs = 2500;

  static double _progress(int elapsedMs) =>
      (elapsedMs / timedRound.inMilliseconds).clamp(0.0, 1.0).toDouble();

  /// Time between new bubbles drops from 850ms to 230ms in 30 seconds.
  static int bubbleSpawnIntervalMs(int elapsedMs) =>
      math.max(230, 850 - (620 * _progress(elapsedMs)).round());

  /// Each bubble stays visible long enough to be tappable on a phone.
  static int bubbleLifetimeMs(int elapsedMs) =>
      math.max(1050, 1900 - (850 * _progress(elapsedMs)).round());

  static int colorSignalIntervalMs(int elapsedMs) =>
      math.max(350, 1000 - (650 * _progress(elapsedMs)).round());

  static int bubblePointsForStreak(int streak) => streak > 0 && streak % 5 == 0 ? 2 : 1;

  static int reactionAverageMs(List<int> times, int falseStarts) {
    if (times.length != reactionTrials || falseStarts < 0 ||
        times.any((time) => time < 0)) {
      throw ArgumentError('A complete five-trial result is required.');
    }
    final total = times.fold<int>(0, (sum, time) => sum + time) +
        falseStarts * falseStartPenaltyMs;
    return (total / reactionTrials).round();
  }
}
