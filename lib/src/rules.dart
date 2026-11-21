import 'dart:math';

enum BattleMode { ranked, hunt }

/// Battle Tap GDD v1.1: these values are intentionally fixed.
abstract final class BattleRules {
  static const rankedDuration = Duration(seconds: 30);
  static const rankedButtonWidthRatio = 0.44;
  static const huntButtonWidthRatio = 0.22;
  static const huntMinSeconds = 18;
  static const huntMaxSeconds = 60;
  static const huntMoveInterval = Duration(milliseconds: 1000);
  static const stopReaction = Duration(seconds: 2);
  static const lateTapPenalty = 2;
  static const introSeconds = 3;
  static const huntCountdownVisible = true;

  static Duration huntDuration(Random random) => Duration(
    seconds: huntMinSeconds + random.nextInt(huntMaxSeconds - huntMinSeconds + 1),
  );
}

class RoundScore {
  RoundScore(this.mode, this.duration);

  final BattleMode mode;
  final Duration duration;
  int hits = 0;
  int misses = 0;
  int lateTaps = 0;

  /// Only a fresh, non-overlapping pointer-down counts. The caller detects
  /// overlapping fingers, long presses and pointer cancellations.
  void tap({required Duration elapsed, required bool hit, bool freshContact = true}) {
    if (!freshContact || elapsed.isNegative) return;
    if (elapsed < duration) {
      if (hit) {
        hits++;
      } else {
        misses++;
      }
    } else if (mode == BattleMode.hunt &&
        elapsed < duration + BattleRules.stopReaction) {
      lateTaps++;
    }
  }

  int get score => hits - lateTaps * BattleRules.lateTapPenalty;
  int get penalty => lateTaps * BattleRules.lateTapPenalty;
  double get accuracy => hits + misses == 0 ? 0 : hits / (hits + misses);
  double get tapsPerSecond => hits / (duration.inMilliseconds / 1000);
  bool inActiveTime(Duration elapsed) => elapsed >= Duration.zero && elapsed < duration;
  bool inStopPhase(Duration elapsed) => mode == BattleMode.hunt &&
      elapsed >= duration && elapsed < duration + BattleRules.stopReaction;
}
