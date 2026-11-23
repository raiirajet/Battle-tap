import 'dart:async';
import 'dart:math' as math;

import 'package:audioplayers/audioplayers.dart';

import 'local_store.dart';

/// The original, short PCM effects are bundled offline. Preloaded pools prevent
/// the normal play-from-file startup latency from slowing down rapid taps.
class BattleAudio {
  BattleAudio(this.store);

  final PracticeStore store;
  final Map<String, AudioPool> _pools = {};
  bool _disposed = false;
  final Stopwatch _tapClock = Stopwatch()..start();
  int _lastPlayedMs = -100000;
  int _lastPopMs = -100000;
  static const _cueNames = ['countdown', 'start', 'stop', 'miss', 'combo', 'record'];

  Future<void> preload() async {
    final names = [
      for (var i = 0; i < 8; i++) 'tap_$i',
      for (var i = 0; i < 3; i++) 'pop_$i',
      ..._cueNames,
    ];
    await Future.wait(names.map((name) async {
      try {
        final pool = await AudioPool.create(
          source: AssetSource('audio/$name.wav'),
          // Cap the concurrent native players: otherwise each rapid tap
          // schedules too many platform-channel requests and drifts behind.
          minPlayers: 1,
          maxPlayers: name.startsWith('tap_') || name.startsWith('pop_') ? 2 : 1,
          playerMode: PlayerMode.lowLatency,
        );
        if (_disposed) {
          await pool.dispose();
        } else {
          _pools[name] = pool;
        }
      } catch (_) {
        // Some emulators have no working sound device. Gameplay must continue.
      }
    }));
  }

  void tap({required int hits, required int combo, required double hitsPerSecond}) {
    final tier = tapSoundTier(
      hits: hits, combo: combo, hitsPerSecond: hitsPerSecond,
      adaptive: store.adaptiveAudioEnabled,
    );
    final now = _tapClock.elapsedMilliseconds;
    // 70 ms caps audio voices to ~14 per second, without dropping GAME hits.
    // It prevents queued sounds from playing after the finger has moved on.
    if (now - _lastPlayedMs < 70) return;
    _lastPlayedMs = now;
    _play('tap_$tier', volume: 0.56);
  }

  /// Short, original air-pocket pops, randomized without blocking input.
  void pop(int variation) {
    final now = _tapClock.elapsedMilliseconds;
    if (now - _lastPopMs < 55) return;
    _lastPopMs = now;
    _play('pop_' + (variation % 3).toString(), volume: .77);
  }

  void countdown() => _play('countdown', volume: 0.46);
  void start() => _play('start', volume: 0.72);
  void stop() => _play('stop', volume: 0.75);
  void miss() => _play('miss', volume: 0.44);
  void combo() => _play('combo', volume: 0.65);
  void record() => _play('record', volume: 0.8);

  void _play(String name, {required double volume}) {
    if (_disposed || !store.soundEnabled) return;
    final pool = _pools[name];
    if (pool == null) return;
    final actualVolume = (volume * store.soundVolume).clamp(0.0, 1.0);
    // Never await a sound inside pointer handling; taps stay frame-rate bound.
    unawaited(pool.start(volume: actualVolume).then<void>((_) {}).catchError((Object _) {}));
  }

  Future<void> dispose() async {
    _disposed = true;
    _tapClock.stop();
    final pools = _pools.values.toList();
    _pools.clear();
    await Future.wait(pools.map((pool) => pool.dispose().catchError((Object _) {})));
  }
}

/// Rising hit count, consecutive combo and tapping speed change the timbre.
/// Adaptation affects feedback only; it never alters scoring or verification.
int tapSoundTier({
  required int hits,
  required int combo,
  required double hitsPerSecond,
  required bool adaptive,
}) {
  if (!adaptive) return 0;
  final progress = hits ~/ 12;
  final chain = combo ~/ 7;
  final speed = math.max(0, (hitsPerSecond - 3.0).floor());
  return math.min(7, math.max(progress, math.max(chain, speed)));
}
