import 'dart:async';
import 'dart:ui' show FontFeature;
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'battle_audio.dart';
import 'local_store.dart';
import 'online.dart';
import 'rules.dart';
import 'ranked_v2.dart';
import 'widgets/golden_splash.dart';
import 'widgets/skin_button.dart';
import 'widgets/tap_shockwave.dart';

enum _Phase { ready, countdown, connecting, playing, stop, verifying, finished, failed }

class GamePage extends StatefulWidget {
  const GamePage({super.key, required this.mode, required this.practice, required this.store, required this.online});
  final BattleMode mode;
  final bool practice;
  final PracticeStore store;
  final OnlineService online;
  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  final Random _rng = Random.secure();
  final Set<int> _pointers = {};
  final List<Map<String, dynamic>> _rankedEvents = [];
  final List<int> _recentHits = [];
  final RhythmCombo _rhythm = RhythmCombo();
  late final BattleAudio _audio = BattleAudio(widget.store);
  late RankedTargetPath _rankedTarget;
  Size _rankedFieldSize = Size.zero;
  int _combo = 0;
  int _lastHapticMs = -100000;
  int _lastUiFrameMs = -100000;
  int _lastEffectMs = -100000;
  int _comboAnnouncementUntilMs = -100000;
  String _comboAnnouncement = '';
  Offset _lastEffectPosition = Offset.zero;
  late final Ticker _ticker = createTicker(_tick);
  final Stopwatch _clock = Stopwatch();
  Timer? _introTimer;
  _Phase _phase = _Phase.ready;
  int _intro = BattleRules.introSeconds;
  late RoundScore _round;
  Offset _huntPosition = const Offset(.4, .4);
  int _lastMoveMs = 0;
  String? _sessionId;
  String? _error;
  bool _showGold = false;
  bool _goldDisplayed = false;
  bool _newBest = false;
  bool _verified = false;
  int _lateFeedbackUntilMs = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _reset();
    unawaited(_audio.preload());
  }

  void _reset() {
    _introTimer?.cancel();
    _ticker.stop();
    _clock..stop()..reset();
    _rankedEvents.clear();
    _pointers.clear();
    _recentHits.clear();
    _rhythm.reset();
    _combo = 0;
    _lastHapticMs = -100000;
    _lastUiFrameMs = -100000;
    _rankedFieldSize = Size.zero;
    _rankedTarget = RankedTargetPath(_rng.nextInt(0x7ffffffe) + 1);
    _lastEffectMs = -100000;
    _comboAnnouncementUntilMs = -100000;
    _comboAnnouncement = '';
    _lastEffectPosition = Offset.zero;
    _sessionId = null;
    _error = null;
    _lastMoveMs = 0;
    _huntPosition = const Offset(.42, .44);
    _showGold = false;
    _goldDisplayed = false;
    _newBest = false;
    _verified = false;
    _lateFeedbackUntilMs = 0;
    _round = RoundScore(widget.mode,
      widget.mode == BattleMode.ranked ? BattleRules.rankedDuration : BattleRules.huntDuration(_rng));
    _phase = _Phase.ready;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed &&
        (_phase == _Phase.playing || _phase == _Phase.stop)) {
      _ticker.stop();
      _clock.stop();
      if (mounted) setState(() { _phase = _Phase.failed;
        _error = 'Runde abgebrochen: Die App wurde unterbrochen. Ranked-Runden können nicht pausiert werden.'; });
    }
  }

  void _start() {
    setState(() { _reset(); _phase = _Phase.countdown; _intro = BattleRules.introSeconds; });
    _audio.countdown();
    _introTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (!mounted) { timer.cancel(); return; }
      if (_intro > 1) {
        setState(() => _intro--);
        _audio.countdown();
      } else {
        timer.cancel();
        await _launchRound();
      }
    });
  }

  Future<void> _launchRound() async {
    if (!mounted) return;
    setState(() => _phase = _Phase.connecting);
    if (widget.mode == BattleMode.ranked && !widget.practice) {
      try {
        final session = await widget.online.startRanked();
        _sessionId = session.sessionId;
        _rankedTarget = RankedTargetPath(session.seed);
      } catch (e) {
        if (mounted) setState(() { _error = 'Ranked-Session nicht verfügbar: $e'; _phase = _Phase.failed; });
        return;
      }
    }
    if (!mounted) return;
    _clock.start();
    _ticker.start();
    setState(() => _phase = _Phase.playing);
    _audio.start();
  }

  void _tick(Duration _) {
    if (!mounted || (_phase != _Phase.playing && _phase != _Phase.stop)) return;
    final elapsed = _clock.elapsed;
    if (widget.mode == BattleMode.hunt && _phase == _Phase.playing &&
        elapsed.inMilliseconds - _lastMoveMs >= BattleRules.huntMoveInterval.inMilliseconds &&
        elapsed < _round.duration) {
      _teleport(elapsed.inMilliseconds);
    }
    if (elapsed >= _round.duration && _phase == _Phase.playing) {
      _phase = widget.mode == BattleMode.hunt ? _Phase.stop : _Phase.verifying;
      if (widget.mode == BattleMode.ranked) {
        _ticker.stop();
        _endRound();
        return;
      }
      if (widget.store.vibrationEnabled) HapticFeedback.heavyImpact();
      _audio.stop();
    }
    if (_phase == _Phase.stop && elapsed >= _round.duration + BattleRules.stopReaction) {
      _ticker.stop();
      _endRound();
      return;
    }
    if (elapsed.inMilliseconds - _lastUiFrameMs >= 33) {
      _lastUiFrameMs = elapsed.inMilliseconds;
      setState(() {});
    }
  }

  void _teleport(int nowMs) {
    Offset next;
    var attempts = 0;
    do {
      next = Offset(.04 + _rng.nextDouble() * .92, .04 + _rng.nextDouble() * .92);
      attempts++;
    } while ((next - _huntPosition).distance < .24 && attempts < 30);
    _huntPosition = next;
    _lastMoveMs = nowMs;
  }

  void _tap(PointerDownEvent event, Size fieldSize) {
    final fresh = _pointers.isEmpty;
    _pointers.add(event.pointer);
    if (!fresh || (_phase != _Phase.playing && _phase != _Phase.stop)) return;
    final elapsed = _clock.elapsed;
    final nowMs = elapsed.inMilliseconds;
    final diameter = widget.mode == BattleMode.ranked
      ? fieldSize.width * RankedV2.diameterRatio(_recentHits, nowMs)
      : fieldSize.width * BattleRules.huntButtonWidthRatio;
    final center = widget.mode == BattleMode.ranked
      ? Offset((fieldSize.width - diameter) * _rankedTarget.position.x + diameter / 2,
               (fieldSize.height - diameter) * _rankedTarget.position.y + diameter / 2)
      : Offset((fieldSize.width - diameter) * _huntPosition.dx + diameter / 2,
               (fieldSize.height - diameter) * _huntPosition.dy + diameter / 2);
    if (widget.mode == BattleMode.ranked) _rankedFieldSize = fieldSize;
    final hit = (event.localPosition - center).distance <= diameter / 2;
    final oldHits = _round.hits;
    _round.tap(elapsed: elapsed, hit: hit);
    if (_round.hits > oldHits) {
      final now = elapsed.inMilliseconds;
      _rhythm.hit(now);
      _combo = _rhythm.combo;
      _recentHits.removeWhere((ms) => now - ms >= RankedV2.speedWindowMs);
      _recentHits.add(now);
      final speed = RankedV2.tapsPerSecond(_recentHits, now);
      _lastEffectMs = now;
      _lastEffectPosition = event.localPosition;
      if (widget.store.vibrationEnabled && now - _lastHapticMs >= 120) {
        _lastHapticMs = now;
        HapticFeedback.selectionClick();
      }
      _audio.tap(hits: _round.hits, combo: _combo, hitsPerSecond: speed);
      if (_combo == 10 || _combo == 25 || _combo == 50 || (_combo > 50 && _combo % 25 == 0)) {
        _comboAnnouncement = '⚡ $_combo COMBO!';
        _comboAnnouncementUntilMs = now + 950;
        _audio.combo();
        if (widget.store.vibrationEnabled) HapticFeedback.mediumImpact();
      }
      if (widget.mode == BattleMode.hunt) {
        _teleport(elapsed.inMilliseconds);
      } else {
        _rankedEvents.add({
          'ms': elapsed.inMilliseconds,
          'x': fieldSize.width == 0 ? 0.5 : event.localPosition.dx / fieldSize.width,
          'y': fieldSize.height == 0 ? 0.5 : event.localPosition.dy / fieldSize.height,
        });
        if (_round.hits % RankedV2.moveEveryHits == 0) {
          // Only accepted taps advance the session-seeded path.
          _rankedTarget.advance();
          _rhythm.reset();
          _combo = 0;
          _recentHits.clear(); // every new target begins at normal difficulty
        }
      }
    } else if (_round.inStopPhase(elapsed)) {
      _rhythm.reset();
      _combo = 0;
      _lateFeedbackUntilMs = elapsed.inMilliseconds + 300;
      if (widget.store.vibrationEnabled) HapticFeedback.mediumImpact();
      _audio.miss();
    } else {
      _rhythm.reset();
      _combo = 0;
    }
    setState(() {});
  }

  Future<void> _endRound() async {
    if (!mounted) return;
    _clock.stop();
    setState(() => _phase = _Phase.verifying);
    if (widget.mode == BattleMode.ranked && !widget.practice) {
      try {
        final result = await widget.online.submitRanked(_sessionId!, _rankedEvents,
          fieldWidth: _rankedFieldSize.width, fieldHeight: _rankedFieldSize.height);
        if (!mounted) return;
        _verified = result['verified'] == true;
        _newBest = result['newBest'] == true && _verified;
        if (!_verified) {
          setState(() { _error = 'Der Server hat das Ergebnis nicht verifiziert.'; _phase = _Phase.failed; });
          return;
        }
      } catch (e) {
        if (mounted) setState(() { _error = 'Ergebnis konnte nicht verifiziert werden: $e'; _phase = _Phase.failed; });
        return;
      }
    } else {
      _newBest = widget.store.savePracticeRound(_round);
    }
    if (!mounted) return;
    if (_newBest) _audio.record();
    setState(() { _phase = _Phase.finished;
      _showGold = _newBest && !widget.store.reducedEffects;
      _goldDisplayed = _showGold; });
  }

  @override
  void dispose() {
    _introTimer?.cancel();
    _ticker.dispose();
    unawaited(_audio.dispose());
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  String get _title => widget.mode == BattleMode.ranked ? 'TAP BATTLE' : 'RANDOM HUNT';
  String get _subTitle => widget.mode == BattleMode.ranked
      ? '30 Sek. • rhythmische Combo • kleiner bei Tempo • Sprung alle 100'
      : '18–60 seconds • visible time • −2 late taps';

  @override
  Widget build(BuildContext context) {
    final remainingMs = max(0, _round.duration.inMilliseconds - _clock.elapsedMilliseconds);
    final active = _phase == _Phase.playing || _phase == _Phase.stop;
    final nowMs = _clock.elapsedMilliseconds;
    return Scaffold(
      appBar: AppBar(title: Text(_title), centerTitle: true),
      body: SafeArea(child: Stack(children: [
        Column(children: [
          const SizedBox(height: 12),
          Text(_subTitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 16),
          Text(active ? (remainingMs / 1000).toStringAsFixed(2) : _round.duration.inSeconds.toString(),
            style: TextStyle(color: _phase == _Phase.stop ? Colors.redAccent : const Color(0xFFFFD974),
              fontSize: 42, fontWeight: FontWeight.w900, fontFeatures: const [FontFeature.tabularFigures()])),
          Text('SCORE  ${_round.score}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          if (widget.mode == BattleMode.ranked && active)
            Text(_combo >= RhythmCombo.qualifyingHits
                  ? '⚡ RHYTHM COMBO  ×$_combo'
                  : 'Tempo ${RankedV2.tapsPerSecond(_recentHits, nowMs).toStringAsFixed(1)}/s  •  ab 5 gleichmässigen Treffern Combo',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFFFFD56C), fontSize: 11)),
          if (widget.practice) const Text('PRACTICE – NOT RANKED',
            style: TextStyle(color: Color(0xFFFFBD63), fontSize: 11, letterSpacing: 1.2)),
          const SizedBox(height: 12),
          Expanded(child: LayoutBuilder(builder: (context, constraints) {
            final fieldSize = Size(constraints.maxWidth, constraints.maxHeight);
            final diameter = widget.mode == BattleMode.ranked
              ? fieldSize.width * RankedV2.diameterRatio(_recentHits, nowMs)
              : fieldSize.width * BattleRules.huntButtonWidthRatio;
            final point = widget.mode == BattleMode.ranked
              ? Offset((fieldSize.width - diameter) * _rankedTarget.position.x,
                       (fieldSize.height - diameter) * _rankedTarget.position.y)
              : Offset((fieldSize.width - diameter) * _huntPosition.dx,
                       (fieldSize.height - diameter) * _huntPosition.dy);
            return Listener(
              behavior: HitTestBehavior.opaque,
              onPointerDown: (event) => _tap(event, fieldSize),
              onPointerUp: (event) => _pointers.remove(event.pointer),
              onPointerCancel: (event) => _pointers.remove(event.pointer),
              child: Stack(clipBehavior: Clip.hardEdge, children: [
                Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  color: _phase == _Phase.stop ? const Color(0xFF43151C) : const Color(0xFF101726),
                  border: Border.all(color: const Color(0xFF2F3547)),
                ))),
                if (active && _phase == _Phase.playing)
                  Positioned(left: point.dx, top: point.dy,
                    child: IgnorePointer(child: SkinButton(skin: widget.store.equipped,
                      size: diameter, animate: widget.mode != BattleMode.ranked &&
                          !widget.store.reducedEffects))),
                if (_phase == _Phase.playing &&
                    !widget.store.reducedEffects &&
                    nowMs >= _lastEffectMs &&
                    nowMs - _lastEffectMs < 260)
                  Positioned.fill(child: IgnorePointer(child: CustomPaint(
                    painter: TapShockwavePainter(
                      position: _lastEffectPosition,
                      progress: (nowMs - _lastEffectMs) / 260,
                      strength: (_combo / 25).clamp(0.0, 1.0),
                    ),
                  ))),
                if (_phase == _Phase.playing &&
                    _combo >= RhythmCombo.qualifyingHits &&
                    !widget.store.reducedEffects)
                  Positioned(top: 18, right: 18,
                    child: IgnorePointer(child: Text('⚡ $_combo COMBO',
                      style: const TextStyle(color: Color(0xFFFFD56C),
                        fontWeight: FontWeight.w900, fontSize: 17,
                        shadows: [Shadow(color: Color(0xFFBC7E21), blurRadius: 12)])))),
                if (_phase == _Phase.playing &&
                    !widget.store.reducedEffects &&
                    nowMs < _comboAnnouncementUntilMs)
                  Positioned.fill(child: IgnorePointer(child: Center(
                    child: Text(_comboAnnouncement, style: const TextStyle(
                      color: Color(0xFFFFE27A), fontWeight: FontWeight.w900,
                      fontSize: 34, shadows: [Shadow(color: Colors.black, blurRadius: 16)]))))),
                if (_phase == _Phase.stop) ...[
                  const Center(child: Text('STOP!', style: TextStyle(fontSize: 62,
                    color: Colors.redAccent, fontWeight: FontWeight.w900))),
                  if (_clock.elapsedMilliseconds < _lateFeedbackUntilMs)
                    const Positioned(top: 22, left: 0, right: 0,
                      child: Center(child: Text('−2', style: TextStyle(color: Colors.redAccent,
                        fontSize: 35, fontWeight: FontWeight.w900)))),
                ],
                if (_phase == _Phase.countdown)
                  Center(child: Text('$_intro', style: const TextStyle(fontSize: 96,
                    color: Color(0xFFFFD974), fontWeight: FontWeight.w900))),
                if (_phase == _Phase.connecting)
                  const Center(child: Column(mainAxisSize: MainAxisSize.min,
                    children: [CircularProgressIndicator(), SizedBox(height: 12), Text('Preparing game...')])),
                if (_phase == _Phase.ready)
                  Center(child: _GameAction(title: 'READY?', subtitle: 'Test your speed and reactions',
                    action: _start, label: 'START')),
                if (_phase == _Phase.failed)
                  Center(child: _GameAction(title: 'ROUND INTERRUPTED', subtitle: _error ?? 'Try again',
                    action: _start, label: 'RETRY')),
                if (_phase == _Phase.verifying)
                  const Center(child: Column(mainAxisSize: MainAxisSize.min,
                    children: [CircularProgressIndicator(), SizedBox(height: 18), Text('Verifying score...')])),
                if (_phase == _Phase.finished)
                  Center(child: _GameAction(title: 'BATTLE COMPLETE',
                    subtitle: 'SCORE ${_round.score}  •  ${_round.hits} hits  •  ${_round.misses} misses\n'
                      '${_round.tapsPerSecond.toStringAsFixed(2)} hits/sec  •  ${_round.lateTaps} late taps\n'
                      '${_verified ? 'VERIFIED RANKED RESULT' : 'PRACTICE RESULT'}',
                    action: _start, label: 'PLAY AGAIN')),
              ]),
            );
          })),
          const SizedBox(height: 8),
          Text(widget.mode == BattleMode.ranked
            ? 'BEST ON DEVICE: ${widget.store.rankedBest}'
            : 'HUNT BEST ON DEVICE: ${widget.store.huntBest}',
            style: const TextStyle(color: Colors.white54)),
          const SizedBox(height: 16),
        ]),
        if (_showGold && _goldDisplayed)
          GoldenSplash(score: _round.score, preview: !_verified,
            onDone: () { if (mounted) setState(() => _showGold = false); }),
      ])),
    );
  }
}

class _GameAction extends StatelessWidget {
  const _GameAction({required this.title, required this.subtitle, required this.action, required this.label});
  final String title;
  final String subtitle;
  final VoidCallback action;
  final String label;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(22),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(title, textAlign: TextAlign.center, style: const TextStyle(
        fontSize: 25, fontWeight: FontWeight.w900, color: Color(0xFFFFD974))),
      const SizedBox(height: 12),
      Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, height: 1.7)),
      const SizedBox(height: 24),
      FilledButton(onPressed: action, child: Text(label)),
    ]),
  );
}
