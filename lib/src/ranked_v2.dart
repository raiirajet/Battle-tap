import 'dart:math' as math;

/// Version 2 of Ranked changes the hit target and is stored on separate
/// leaderboards. Both the Flutter client and Cloud Function use these numbers.
abstract final class RankedV2 {
  static const rulesVersion = 2;
  static const baseDiameterRatio = .44;
  static const minDiameterRatio = .11; // one quarter of the original diameter
  static const moveEveryHits = 100;
  static const speedWindowMs = 1200;

  /// Speed is measured using only already accepted hits. This means the
  /// current target's hitbox can never shrink while its pointer is processed.
  static double diameterRatio(Iterable<int> previousHitsMs, int nowMs) {
    var count = 0;
    for (final t in previousHitsMs) {
      if (t <= nowMs && nowMs - t < speedWindowMs) count++;
    }
    final hitsPerSecond = count * 1000 / speedWindowMs;
    final progress = ((hitsPerSecond - 2) / 9).clamp(0.0, 1.0);
    return baseDiameterRatio * (1 - .75 * progress);
  }

  static double tapsPerSecond(Iterable<int> hitsMs, int nowMs) {
    var count = 0;
    for (final t in hitsMs) {
      if (t <= nowMs && nowMs - t < speedWindowMs) count++;
    }
    return count * 1000 / speedWindowMs;
  }
}

/// Predictable ONLY within a single session: the signed-in server chooses the
/// seed and reconstructs the same hit positions for validation. Offline rounds
/// use a fresh random seed. A different seed means a different trajectory.
class RankedTargetPath {
  RankedTargetPath(int seed) : _state = seed == 0 ? 1 : seed & 0xFFFFFFFF;
  int _state;
  math.Point<double> position = const math.Point(.5, .5);

  double _randomUnit() {
    var x = _state;
    x = (x ^ ((x << 13) & 0xFFFFFFFF)) & 0xFFFFFFFF;
    x = (x ^ (x >> 17)) & 0xFFFFFFFF;
    x = (x ^ ((x << 5) & 0xFFFFFFFF)) & 0xFFFFFFFF;
    _state = x;
    return x / 4294967296.0;
  }

  math.Point<double> advance() {
    late math.Point<double> next;
    for (var i = 0; i < 24; i++) {
      next = math.Point(.07 + .86 * _randomUnit(),
          .07 + .86 * _randomUnit());
      if (position.distanceTo(next) >= .26) break;
    }
    position = next;
    return next;
  }
}

/// A combo begins only after FOUR consecutive on-tempo intervals (5 hits).
/// Each subsequent interval must remain within a strict relative rhythm band.
/// Faster isolated taps and random mashing never create an automatic combo.
class RhythmCombo {
  static const minimumIntervalMs = 65;
  static const maximumIntervalMs = 680;
  static const qualifyingHits = 5;
  int? _last;
  int _candidateHits = 0;
  final List<int> _intervals = [];
  int combo = 0;

  void reset() {
    _last = null;
    _candidateHits = 0;
    _intervals.clear();
    combo = 0;
  }

  void hit(int nowMs) {
    final previous = _last;
    _last = nowMs;
    if (previous == null) {
      _candidateHits = 1;
      combo = 0;
      return;
    }
    final interval = nowMs - previous;
    if (interval < minimumIntervalMs || interval > maximumIntervalMs) {
      _candidateHits = 1;
      _intervals.clear();
      combo = 0;
      return;
    }
    if (_intervals.isNotEmpty) {
      final ordered = [..._intervals]..sort();
      final target = ordered[ordered.length ~/ 2];
      final tolerance = math.max(27.0, target * .18);
      if ((interval - target).abs() > tolerance) {
        // This interval may be the start of a NEW constant rhythm.
        _intervals..clear()..add(interval);
        _candidateHits = 2;
        combo = 0;
        return;
      }
    }
    _intervals.add(interval);
    if (_intervals.length > 4) _intervals.removeAt(0);
    _candidateHits++;
    combo = _candidateHits >= qualifyingHits ? _candidateHits : 0;
  }
}
