import 'dart:async';
import 'dart:math';
import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'arcade_rules.dart';
import 'battle_audio.dart';
import 'battle_design.dart';
import 'local_store.dart';

enum _ArcadePhase { ready, countdown, playing, finished, interrupted }

class _Bubble {
  const _Bubble(this.id, this.position, this.radiusRatio, this.bornMs, this.lifetimeMs);
  final int id;
  final Offset position;
  final double radiusRatio;
  final int bornMs;
  final int lifetimeMs;
}

class ArcadePage extends StatefulWidget {
  const ArcadePage({super.key, required this.mode, required this.store});
  final ArcadeMode mode;
  final PracticeStore store;

  @override
  State<ArcadePage> createState() => _ArcadePageState();
}

class _ArcadePageState extends State<ArcadePage> with WidgetsBindingObserver {
  final Random _random = Random.secure();
  final Stopwatch _clock = Stopwatch();
  final Set<int> _pointers = <int>{};
  final List<_Bubble> _bubbles = [];
  final List<int> _reactionTimes = [];
  late final BattleAudio _audio = BattleAudio(widget.store);
  Timer? _countdownTimer;
  Timer? _loop;
  _ArcadePhase _phase = _ArcadePhase.ready;
  int _intro = 3;
  int _score = 0;
  int _hits = 0;
  int _misses = 0;
  int _streak = 0;
  int _maxStreak = 0;
  int _spawnAtMs = 0;
  int _bubbleId = 0;
  int _lastHapticMs = -9999;
  bool _newRecord = false;
  bool _signalGreen = true;
  int _colorChangesAtMs = 0;
  Offset _colorPosition = const Offset(.5, .5);
  bool _goVisible = false;
  int _goAtMs = 0;
  int _goShownAtMs = 0;
  int _falseStarts = 0;
  String _message = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_audio.preload());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed &&
        (_phase == _ArcadePhase.playing || _phase == _ArcadePhase.countdown)) {
      _countdownTimer?.cancel();
      _loop?.cancel();
      _clock.stop();
      widget.store.flushTapCount();
      if (mounted) setState(() {
        _phase = _ArcadePhase.interrupted;
        _message = 'Die Runde wurde unterbrochen. Starte sie erneut.';
      });
    }
  }

  void _reset() {
    _countdownTimer?.cancel();
    _loop?.cancel();
    _clock..stop()..reset();
    _pointers.clear();
    _bubbles.clear();
    _reactionTimes.clear();
    _score = 0;
    _hits = 0;
    _misses = 0;
    _streak = 0;
    _maxStreak = 0;
    _spawnAtMs = 0;
    _bubbleId = 0;
    _lastHapticMs = -9999;
    _newRecord = false;
    _signalGreen = true;
    _colorChangesAtMs = 0;
    _colorPosition = const Offset(.5, .5);
    _goVisible = false;
    _goAtMs = 0;
    _goShownAtMs = 0;
    _falseStarts = 0;
    _message = '';
  }

  void _start() {
    _reset();
    setState(() { _intro = 3; _phase = _ArcadePhase.countdown; });
    _audio.countdown();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) { timer.cancel(); return; }
      if (_intro > 1) {
        setState(() => _intro--);
        _audio.countdown();
      } else {
        timer.cancel();
        _begin();
      }
    });
  }

  void _begin() {
    if (!mounted) return;
    _clock.start();
    _phase = _ArcadePhase.playing;
    switch (widget.mode) {
      case ArcadeMode.bubbleRush:
        _spawnBubble(0);
        break;
      case ArcadeMode.colorTrap:
        _changeSignal(0);
        break;
      case ArcadeMode.reflexGo:
        _scheduleGo(0);
        break;
    }
    _audio.start();
    _loop = Timer.periodic(const Duration(milliseconds: 33), (_) => _tick());
    setState(() {});
  }

  void _tick() {
    if (!mounted || _phase != _ArcadePhase.playing) return;
    final ms = _clock.elapsedMilliseconds;
    if (widget.mode != ArcadeMode.reflexGo &&
        ms >= ArcadeRules.timedRound.inMilliseconds) {
      _finish();
      return;
    }
    switch (widget.mode) {
      case ArcadeMode.bubbleRush:
        final expired = _bubbles.where((b) => ms >= b.bornMs + b.lifetimeMs).length;
        if (expired > 0) {
          _bubbles.removeWhere((b) => ms >= b.bornMs + b.lifetimeMs);
          _misses += expired;
          _streak = 0;
        }
        if (ms >= _spawnAtMs && _bubbles.length < 6) _spawnBubble(ms);
        break;
      case ArcadeMode.colorTrap:
        if (ms >= _colorChangesAtMs) _changeSignal(ms);
        break;
      case ArcadeMode.reflexGo:
        if (!_goVisible && ms >= _goAtMs) {
          _goVisible = true;
          _goShownAtMs = ms;
          _audio.start();
        } else if (_goVisible && ms - _goShownAtMs >= ArcadeRules.reactionTimeoutMs) {
          _reactionTimes.add(ArcadeRules.reactionTimeoutMs);
          _misses++;
          _nextTrial(ms);
        }
        break;
    }
    setState(() {});
  }

  void _spawnBubble(int ms) {
    // Avoid stacking bubbles on top of one another, even on narrow screens.
    Offset pos = const Offset(.5, .5);
    for (var attempt = 0; attempt < 32; attempt++) {
      pos = Offset(.14 + _random.nextDouble() * .72,
          .12 + _random.nextDouble() * .76);
      if (_bubbles.every((b) => (b.position - pos).distance > .20)) break;
    }
    _bubbles.add(_Bubble(++_bubbleId, pos,
        .087 + _random.nextDouble() * .027, ms,
        ArcadeRules.bubbleLifetimeMs(ms)));
    _spawnAtMs = ms + ArcadeRules.bubbleSpawnIntervalMs(ms);
  }

  void _changeSignal(int ms) {
    _signalGreen = _random.nextDouble() < .60;
    _colorPosition = Offset(.23 + _random.nextDouble() * .54,
        .20 + _random.nextDouble() * .60);
    _colorChangesAtMs = ms + ArcadeRules.colorSignalIntervalMs(ms);
  }

  void _scheduleGo(int ms) {
    _goVisible = false;
    _goAtMs = ms + 1000 + _random.nextInt(1800);
  }

  void _nextTrial(int ms) {
    if (_reactionTimes.length >= ArcadeRules.reactionTrials) {
      _finish();
    } else {
      _scheduleGo(ms);
    }
  }

  void _tap(PointerDownEvent event, Size size) {
    final fresh = _pointers.isEmpty;
    _pointers.add(event.pointer);
    if (!fresh || _phase != _ArcadePhase.playing) return;
    widget.store.registerTap();
    final ms = _clock.elapsedMilliseconds;

    if (widget.mode != ArcadeMode.reflexGo &&
        ms >= ArcadeRules.timedRound.inMilliseconds) {
      _finish();
      return;
    }
    switch (widget.mode) {
      case ArcadeMode.bubbleRush:
        var selectedIndex = -1;
        for (var i = _bubbles.length - 1; i >= 0; i--) {
          final bubble = _bubbles[i];
          final center = Offset(size.width * bubble.position.dx,
              size.height * bubble.position.dy);
          final radius = min(48.0, size.shortestSide * bubble.radiusRatio);
          if ((center - event.localPosition).distance <= radius) {
            selectedIndex = i;
            break;
          }
        }
        if (selectedIndex >= 0) {
          _bubbles.removeAt(selectedIndex);
          _hits++;
          _streak++;
          _maxStreak = max(_maxStreak, _streak);
          _score += ArcadeRules.bubblePointsForStreak(_streak);
          _audio.pop(_random.nextInt(3));
          if (_streak % 5 == 0) _audio.combo();
          _haptic(ms);
        } else {
          _misses++;
          _streak = 0;
        }
        break;
      case ArcadeMode.colorTrap:
        final diameter = min(size.shortestSide * .39, 160.0);
        final center = Offset(size.width * _colorPosition.dx,
            size.height * _colorPosition.dy);
        final onTarget = (center - event.localPosition).distance <= diameter / 2;
        if (onTarget && _signalGreen) {
          _score++;
          _hits++;
          _streak++;
          _maxStreak = max(_maxStreak, _streak);
          _audio.tap(hits: _hits, combo: _streak,
              hitsPerSecond: _hits / max(1, ms / 1000));
          _haptic(ms);
          _changeSignal(ms);
        } else if (onTarget) {
          _score -= 2;
          _misses++;
          _streak = 0;
          _audio.miss();
          if (widget.store.vibrationEnabled) HapticFeedback.mediumImpact();
          _changeSignal(ms);
        } else {
          _misses++;
          _streak = 0;
        }
        break;
      case ArcadeMode.reflexGo:
        if (_goVisible) {
          final reaction = max(1, ms - _goShownAtMs);
          _reactionTimes.add(reaction);
          _hits++;
          _audio.pop(_random.nextInt(3));
          _haptic(ms);
          _nextTrial(ms);
        } else {
          _falseStarts++;
          _misses++;
          _audio.miss();
          // Re-randomize wait: repeated premature taps cannot reveal GO time.
          _scheduleGo(ms);
        }
        break;
    }
    if (mounted) setState(() {});
  }

  void _haptic(int ms) {
    if (widget.store.vibrationEnabled && ms - _lastHapticMs >= 110) {
      _lastHapticMs = ms;
      HapticFeedback.selectionClick();
    }
  }

  void _finish() {
    if (_phase != _ArcadePhase.playing) return;
    _loop?.cancel();
    _clock.stop();
    if (widget.mode == ArcadeMode.reflexGo) {
      _score = ArcadeRules.reactionAverageMs(_reactionTimes, _falseStarts);
    }
    _newRecord = widget.store.saveArcadeRound(
      mode: widget.mode, score: _score, hits: _hits);
    _audio.stop();
    if (_newRecord) _audio.record();
    if (mounted) setState(() => _phase = _ArcadePhase.finished);
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _loop?.cancel();
    _clock.stop();
    widget.store.flushTapCount();
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_audio.dispose());
    super.dispose();
  }

  Widget _bubbleWidget(_Bubble bubble, Size size, int ms) {
    final radius = min(48.0, size.shortestSide * bubble.radiusRatio);
    final remaining = ((bubble.bornMs + bubble.lifetimeMs - ms) /
        bubble.lifetimeMs).clamp(0.0, 1.0).toDouble();
    final diameter = radius * 2;
    return Positioned(
      key: ValueKey(bubble.id),
      left: size.width * bubble.position.dx - radius,
      top: size.height * bubble.position.dy - radius,
      child: IgnorePointer(child: Container(
        width: diameter,
        height: diameter,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const RadialGradient(
            center: Alignment(-.35, -.45), radius: .95,
            colors: [Color(0xFFC4FBFF), Color(0xFF42C5EC), Color(0xFF2754C4)]),
          border: Border.all(color: Colors.white.withValues(alpha: .65), width: 2),
          boxShadow: widget.store.reducedEffects ? [] : [
            BoxShadow(color: const Color(0xFF43D9FF).withValues(alpha: remaining * .47),
              blurRadius: 18, spreadRadius: 2),
          ],
        ),
        child: Align(alignment: const Alignment(-.4, -.45),
          child: Container(width: radius * .46, height: radius * .24,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: .7),
              borderRadius: BorderRadius.circular(20)))),
      )),
    );
  }

  Widget _field(Size size) {
    final ms = _clock.elapsedMilliseconds;
    final running = _phase == _ArcadePhase.playing;
    return Listener(
      behavior: HitTestBehavior.opaque,
      onPointerDown: (event) => _tap(event, size),
      onPointerUp: (event) => _pointers.remove(event.pointer),
      onPointerCancel: (event) => _pointers.remove(event.pointer),
      child: Stack(clipBehavior: Clip.hardEdge, children: [
        Positioned.fill(child: BattleArena(
          accent: widget.mode == ArcadeMode.bubbleRush ? BattleColors.cyan
              : widget.mode == ArcadeMode.colorTrap ? BattleColors.green
              : BattleColors.gold,
        )),
        if (running && widget.mode == ArcadeMode.bubbleRush)
          for (final bubble in _bubbles) _bubbleWidget(bubble, size, ms),
        if (running && widget.mode == ArcadeMode.colorTrap)
          Positioned(
            left: size.width * _colorPosition.dx - min(size.shortestSide * .39, 160.0) / 2,
            top: size.height * _colorPosition.dy - min(size.shortestSide * .39, 160.0) / 2,
            child: IgnorePointer(child: Container(
              width: min(size.shortestSide * .39, 160.0),
              height: min(size.shortestSide * .39, 160.0),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _signalGreen ? const Color(0xFF28BC75) : const Color(0xFFDA4056),
                boxShadow: widget.store.reducedEffects ? [] : [BoxShadow(
                  color: (_signalGreen ? Colors.greenAccent : Colors.redAccent)
                      .withValues(alpha: .38), blurRadius: 26, spreadRadius: 4)],
                border: Border.all(color: Colors.white70, width: 3),
              ),
              child: Text(_signalGreen ? 'GO!' : 'STOP',
                style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w900)),
            )),
          ),
        if (running && widget.mode == ArcadeMode.reflexGo)
          Positioned.fill(child: IgnorePointer(child: AnimatedContainer(
            duration: widget.store.reducedEffects ? Duration.zero
                : const Duration(milliseconds: 90),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: _goVisible ? const Color(0xFF186C49) : const Color(0xFF562C36),
              borderRadius: BorderRadius.circular(22)),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(_goVisible ? Icons.flash_on_rounded : Icons.pan_tool_alt_rounded,
                size: 86, color: Colors.white),
              const SizedBox(height: 14),
              Text(_goVisible ? 'GO!' : 'WARTEN',
                style: const TextStyle(fontSize: 45, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              Text('VERSUCH ${_reactionTimes.length + 1} / ${ArcadeRules.reactionTrials}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white70)),
            ]),
          ))),
        if (_phase == _ArcadePhase.countdown)
          Center(child: Text('$_intro', style: const TextStyle(
            color: Color(0xFFFFD56C), fontWeight: FontWeight.w900, fontSize: 94))),
        if (_phase == _ArcadePhase.ready || _phase == _ArcadePhase.interrupted ||
            _phase == _ArcadePhase.finished)
          Positioned.fill(child: ColoredBox(color: const Color(0xDD0B1120),
            child: Center(child: SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(_phase == _ArcadePhase.finished ? Icons.emoji_events_rounded
                    : Icons.sports_esports_rounded,
                  color: const Color(0xFFFFD56C), size: 54),
                const SizedBox(height: 10),
                Text(_phase == _ArcadePhase.finished ? 'RUNDE BEENDET'
                    : _phase == _ArcadePhase.interrupted ? 'UNTERBROCHEN' : 'BEREIT?',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 25,
                    color: Color(0xFFFFD56C))),
                const SizedBox(height: 10),
                Text(_phase == _ArcadePhase.finished
                      ? '${widget.mode.formatScore(_score)}\n'
                        '$_hits Treffer • $_misses Fehler'
                        '${widget.mode == ArcadeMode.reflexGo ? ' • $_falseStarts Frühstarts' : ''}\n'
                        '${_newRecord ? '🏆 NEUER BESTWERT!' : 'Dein Bestwert: ${_bestLabel()}'}'
                      : _phase == _ArcadePhase.interrupted ? _message
                      : widget.mode.instruction,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, height: 1.6)),
                const SizedBox(height: 22),
                FilledButton(onPressed: _start, child: Text(
                  _phase == _ArcadePhase.finished ? 'NOCHMAL SPIELEN' : 'STARTEN')),
              ]),
            )),
          )),
      ]),
    );
  }

  String _bestLabel() {
    final best = widget.store.arcadeBest(widget.mode);
    return best == null ? '—' : widget.mode.formatScore(best);
  }

  @override
  Widget build(BuildContext context) {
    final running = _phase == _ArcadePhase.playing;
    final remaining = max(0, ArcadeRules.timedRound.inMilliseconds - _clock.elapsedMilliseconds);
    final value = widget.mode == ArcadeMode.reflexGo
        ? '${_reactionTimes.length} / ${ArcadeRules.reactionTrials}'
        : (remaining / 1000).toStringAsFixed(1) + ' s';
    return Scaffold(
      appBar: AppBar(title: Text(widget.mode.title), centerTitle: true),
      body: SafeArea(child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(children: [
          BattleSurface(
            accent: widget.mode == ArcadeMode.bubbleRush ? BattleColors.cyan
                : widget.mode == ArcadeMode.colorTrap ? BattleColors.green
                : BattleColors.gold,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            child: Column(children: [
          Text(widget.mode.description, textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 10),
          Text(running ? value : widget.mode == ArcadeMode.reflexGo
              ? '${ArcadeRules.reactionTrials} VERSUCHE' : '30.0 s',
            style: const TextStyle(fontSize: 37, fontWeight: FontWeight.w900,
              color: Color(0xFFFFD56C), fontFeatures: [FontFeature.tabularFigures()])),
          if (widget.mode != ArcadeMode.reflexGo)
            Text('PUNKTE  $_score', style: const TextStyle(
              fontSize: 23, fontWeight: FontWeight.w900)),
          if (widget.mode == ArcadeMode.reflexGo && running)
            Text('FRÜHSTARTS $_falseStarts', style: const TextStyle(
              fontSize: 15, color: Colors.white70)),
          const SizedBox(height: 4),
          const Text('LOCAL ARCADE • KEINE ONLINE-RANGLISTE',
            style: TextStyle(color: Color(0xFFFFC77E), fontSize: 10, letterSpacing: 1)),
            ]),
          ),
          const SizedBox(height: 10),
          Expanded(child: LayoutBuilder(builder: (context, c) => _field(
              Size(c.maxWidth, c.maxHeight)))),
          const SizedBox(height: 12),
          Text('BESTWERT: ${_bestLabel()}',
            style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
        ]),
      )),
    );
  }
}
