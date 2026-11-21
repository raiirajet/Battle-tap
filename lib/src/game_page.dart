import 'dart:async';
import 'dart:ui' show FontFeature;
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'local_store.dart';
import 'online.dart';
import 'rules.dart';
import 'widgets/golden_splash.dart';
import 'widgets/skin_button.dart';

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
  }

  void _reset() {
    _introTimer?.cancel();
    _ticker.stop();
    _clock..stop()..reset();
    _rankedEvents.clear();
    _pointers.clear();
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
    _introTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (!mounted) { timer.cancel(); return; }
      if (_intro > 1) {
        setState(() => _intro--);
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
        _sessionId = await widget.online.startRanked();
      } catch (e) {
        if (mounted) setState(() { _error = 'Ranked-Session nicht verfügbar: $e'; _phase = _Phase.failed; });
        return;
      }
    }
    if (!mounted) return;
    _clock.start();
    _ticker.start();
    setState(() => _phase = _Phase.playing);
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
      if (widget.store.soundEnabled) SystemSound.play(SystemSoundType.alert);
    }
    if (_phase == _Phase.stop && elapsed >= _round.duration + BattleRules.stopReaction) {
      _ticker.stop();
      _endRound();
      return;
    }
    setState(() {});
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
    final diameter = MediaQuery.sizeOf(context).width *
        (widget.mode == BattleMode.ranked ? BattleRules.rankedButtonWidthRatio : BattleRules.huntButtonWidthRatio);
    final center = widget.mode == BattleMode.ranked
      ? Offset(fieldSize.width / 2, fieldSize.height / 2)
      : Offset((fieldSize.width - diameter) * _huntPosition.dx + diameter / 2,
               (fieldSize.height - diameter) * _huntPosition.dy + diameter / 2);
    final hit = (event.localPosition - center).distance <= diameter / 2;
    final oldHits = _round.hits;
    _round.tap(elapsed: elapsed, hit: hit);
    if (_round.hits > oldHits) {
      if (widget.store.vibrationEnabled) HapticFeedback.selectionClick();
      if (widget.store.soundEnabled) SystemSound.play(SystemSoundType.click);
      if (widget.mode == BattleMode.hunt) {
        _teleport(elapsed.inMilliseconds);
      } else {
        _rankedEvents.add({
          'ms': elapsed.inMilliseconds,
          'x': fieldSize.width == 0 ? 0.5 : event.localPosition.dx / fieldSize.width,
          'y': fieldSize.height == 0 ? 0.5 : event.localPosition.dy / fieldSize.height,
        });
      }
    } else if (_round.inStopPhase(elapsed)) {
      _lateFeedbackUntilMs = elapsed.inMilliseconds + 300;
      if (widget.store.vibrationEnabled) HapticFeedback.mediumImpact();
      if (widget.store.soundEnabled) SystemSound.play(SystemSoundType.alert);
    }
    setState(() {});
  }

  Future<void> _endRound() async {
    if (!mounted) return;
    _clock.stop();
    setState(() => _phase = _Phase.verifying);
    if (widget.mode == BattleMode.ranked && !widget.practice) {
      try {
        final result = await widget.online.submitRanked(_sessionId!, _rankedEvents);
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
    setState(() { _phase = _Phase.finished;
      _showGold = _newBest && !widget.store.reducedEffects;
      _goldDisplayed = _showGold; });
  }

  @override
  void dispose() {
    _introTimer?.cancel();
    _ticker.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  String get _title => widget.mode == BattleMode.ranked ? 'TAP BATTLE' : 'RANDOM HUNT';
  String get _subTitle => widget.mode == BattleMode.ranked
      ? '30 seconds • 44% button • +1 each'
      : '18–60 seconds • visible time • −2 late taps';

  @override
  Widget build(BuildContext context) {
    final remainingMs = max(0, _round.duration.inMilliseconds - _clock.elapsedMilliseconds);
    final active = _phase == _Phase.playing || _phase == _Phase.stop;
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
          if (widget.practice) const Text('PRACTICE – NOT RANKED',
            style: TextStyle(color: Color(0xFFFFBD63), fontSize: 11, letterSpacing: 1.2)),
          const SizedBox(height: 12),
          Expanded(child: LayoutBuilder(builder: (context, constraints) {
            final fieldSize = Size(constraints.maxWidth, constraints.maxHeight);
            final diameter = MediaQuery.sizeOf(context).width *
                (widget.mode == BattleMode.ranked ? BattleRules.rankedButtonWidthRatio : BattleRules.huntButtonWidthRatio);
            final point = widget.mode == BattleMode.ranked
              ? Offset((fieldSize.width - diameter) / 2, (fieldSize.height - diameter) / 2)
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
                    child: IgnorePointer(child: SkinButton(skin: widget.store.equipped, size: diameter))),
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
