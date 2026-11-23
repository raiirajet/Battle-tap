import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'battle_audio.dart';
import 'local_store.dart';
import 'skill_rules.dart';

enum _DuelPhase { setup, countdown, playing, handoff, result, interrupted }

/// Local pass-and-play: same deterministic target sequence and time limit
/// for both players. No online pairing or unverified ranked submissions.
class DuelPage extends StatefulWidget {
  const DuelPage({super.key, required this.store});
  final PracticeStore store;

  @override
  State<DuelPage> createState() => _DuelPageState();
}

class _DuelPageState extends State<DuelPage> with WidgetsBindingObserver {
  final TextEditingController _nameA = TextEditingController(text: 'Spieler 1');
  final TextEditingController _nameB = TextEditingController(text: 'Spieler 2');
  late final BattleAudio _audio = BattleAudio(widget.store);
  final Stopwatch _clock = Stopwatch();
  final Set<int> _pointers = <int>{};
  Timer? _countdown;
  Timer? _frameTimer;
  _DuelPhase _phase = _DuelPhase.setup;
  List<math.Point<double>> _path = const [];
  List<int> _scores = [0, 0];
  List<int> _hits = [0, 0];
  List<int> _misses = [0, 0];
  String _firstName = 'Spieler 1';
  String _secondName = 'Spieler 2';
  int _turn = 0;
  int _targetIndex = 0;
  int _streak = 0;
  int _intro = 3;
  int _lastHapticMs = -9999;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_audio.preload());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) return;
    if (_phase == _DuelPhase.playing || _phase == _DuelPhase.countdown) {
      _stopTimers();
      widget.store.flushTapCount();
      if (mounted) setState(() => _phase = _DuelPhase.interrupted);
    }
  }

  void _stopTimers() {
    _countdown?.cancel();
    _frameTimer?.cancel();
    _clock.stop();
  }

  String get _playerName => _turn == 0 ? _firstName : _secondName;

  void _newMatch() {
    _stopTimers();
    final a = _nameA.text.trim();
    final b = _nameB.text.trim();
    _firstName = a.isEmpty ? 'Spieler 1' : a;
    _secondName = b.isEmpty ? 'Spieler 2' : b;
    _scores = [0, 0];
    _hits = [0, 0];
    _misses = [0, 0];
    _turn = 0;
    _path = SkillRules.duelTargets(math.Random.secure().nextInt(1 << 31));
    _startTurn();
  }

  void _startTurn() {
    _stopTimers();
    _clock.reset();
    _pointers.clear();
    _targetIndex = 0;
    _streak = 0;
    _lastHapticMs = -9999;
    _intro = 3;
    setState(() => _phase = _DuelPhase.countdown);
    _audio.countdown();
    _countdown = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _phase != _DuelPhase.countdown) {
        timer.cancel();
        return;
      }
      if (_intro > 1) {
        setState(() => _intro--);
        _audio.countdown();
      } else {
        timer.cancel();
        _clock.start();
        _audio.start();
        setState(() => _phase = _DuelPhase.playing);
        _frameTimer = Timer.periodic(const Duration(milliseconds: 33), (_) {
          if (!mounted || _phase != _DuelPhase.playing) return;
          if (_clock.elapsed >= SkillRules.duelDuration) {
            _endTurn();
          } else {
            setState(() {});
          }
        });
      }
    });
  }

  void _tap(PointerDownEvent event, Size fieldSize) {
    final fresh = _pointers.isEmpty;
    _pointers.add(event.pointer);
    if (!fresh || _phase != _DuelPhase.playing) return;
    if (_clock.elapsed >= SkillRules.duelDuration) {
      _endTurn();
      return;
    }
    widget.store.registerTap();
    final current = _path[_targetIndex % _path.length];
    final center = Offset(current.x * fieldSize.width,
        current.y * fieldSize.height);
    final diameter = math.min(120.0,
        fieldSize.shortestSide * SkillRules.duelTargetRatio);
    if ((center - event.localPosition).distance <= diameter / 2) {
      _hits[_turn]++;
      _streak++;
      _scores[_turn] += SkillRules.duelHitPoints(_streak);
      _targetIndex++;
      _audio.tap(hits: _hits[_turn], combo: _streak,
          hitsPerSecond: _hits[_turn] * 1000 /
              math.max(1000, _clock.elapsedMilliseconds));
      if (_streak % 10 == 0) _audio.combo();
      if (widget.store.vibrationEnabled &&
          _clock.elapsedMilliseconds - _lastHapticMs > 110) {
        _lastHapticMs = _clock.elapsedMilliseconds;
        HapticFeedback.selectionClick();
      }
    } else {
      _misses[_turn]++;
      _streak = 0;
      _audio.miss();
    }
    if (mounted) setState(() {});
  }

  void _endTurn() {
    if (_phase != _DuelPhase.playing) return;
    _stopTimers();
    _audio.stop();
    if (_turn == 0) {
      setState(() => _phase = _DuelPhase.handoff);
    } else {
      widget.store.saveDuelMatch(
          firstScore: _scores[0], secondScore: _scores[1],
          firstHits: _hits[0], secondHits: _hits[1]);
      if (SkillRules.duelWinner(_scores[0], _scores[1]) != null) {
        _audio.record();
      }
      setState(() => _phase = _DuelPhase.result);
    }
  }

  void _secondPlayer() {
    if (_phase != _DuelPhase.handoff) return;
    _turn = 1;
    _startTurn();
  }

  @override
  void dispose() {
    _stopTimers();
    _nameA.dispose();
    _nameB.dispose();
    widget.store.flushTapCount();
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_audio.dispose());
    super.dispose();
  }

  Widget _panel() {
    final result = _phase == _DuelPhase.result;
    final handoff = _phase == _DuelPhase.handoff;
    final interrupted = _phase == _DuelPhase.interrupted;
    final winner = SkillRules.duelWinner(_scores[0], _scores[1]);
    return Positioned.fill(child: ColoredBox(
      color: const Color(0xF20C1525),
      child: Center(child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(result ? Icons.emoji_events_rounded : Icons.people_alt_rounded,
            color: const Color(0xFFFFD56C), size: 64),
          const SizedBox(height: 12),
          Text(result
              ? winner == null ? 'UNENTSCHIEDEN!' :
                    '${winner == 0 ? _firstName : _secondName} GEWINNT!'
              : handoff ? 'HANDY WEITERGEBEN'
              : interrupted ? 'DUELL UNTERBROCHEN' : '1 GEGEN 1',
            textAlign: TextAlign.center, style: const TextStyle(
              fontSize: 24, color: Color(0xFFFFD56C),
              fontWeight: FontWeight.w900)),
          const SizedBox(height: 16),
          if (_phase == _DuelPhase.setup) ...[
            const Text('Jeder spielt 20 Sekunden dieselbe zufällige Zielabfolge. '
                'Nach 10 Treffern in Folge gibt es Bonuspunkte.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, height: 1.6)),
            const SizedBox(height: 16),
            TextField(controller: _nameA, maxLength: 20,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Name Spieler 1', prefixIcon: Icon(Icons.person))),
            const SizedBox(height: 6),
            TextField(controller: _nameB, maxLength: 20,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Name Spieler 2', prefixIcon: Icon(Icons.person_outline))),
          ],
          if (handoff) Text('$_firstName hat ${_scores[0]} Punkte erzielt.\n'
              'Jetzt ist $_secondName dran – dieselbe Herausforderung!',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, height: 1.7)),
          if (result) ...[
            _resultRow(_firstName, _scores[0], _hits[0], winner == 0),
            _resultRow(_secondName, _scores[1], _hits[1], winner == 1),
            const SizedBox(height: 8),
            Text('Duelle auf diesem Gerät: ${widget.store.duelMatches}\n'
                'Höchster Duell-Score: ${widget.store.duelBest}',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white54)),
          ],
          if (interrupted) const Text('Ein unterbrochenes Duell wird nicht gewertet. '
              'Beide Spieler starten eine neue Herausforderung.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, height: 1.6)),
          const SizedBox(height: 22),
          FilledButton(onPressed: handoff ? _secondPlayer : _newMatch,
            child: Text(handoff ? 'SPIELER 2 STARTEN' :
                result ? 'REVANCHE' : 'DUELL STARTEN')),
          const SizedBox(height: 10),
          const Text('LOKAL AUF EINEM GERÄT • KEIN ONLINE-MULTIPLAYER',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: Colors.white54)),
        ]),
      )),
    ));
  }

  Widget _resultRow(String name, int score, int hits, bool winner) =>
      Padding(padding: const EdgeInsets.symmetric(vertical: 6),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: winner ? const Color(0xFF294B3A) : const Color(0xFF202A3C),
            borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Expanded(child: Text(name,
              style: const TextStyle(fontWeight: FontWeight.w800))),
            Text('$score P. • $hits Hits',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: winner ? const Color(0xFF8AE6A7) : Colors.white70)),
          ]),
        ));

  @override
  Widget build(BuildContext context) {
    final active = _phase == _DuelPhase.playing;
    final countdown = _phase == _DuelPhase.countdown;
    final msRemaining = math.max(0,
        SkillRules.duelDuration.inMilliseconds - _clock.elapsedMilliseconds);
    return Scaffold(
      appBar: AppBar(title: const Text('1 GEGEN 1 ARCADE'), centerTitle: true),
      body: SafeArea(child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(children: [
          Text(_phase == _DuelPhase.setup ? 'BATTLE TAP DUEL DASH'
              : 'AM ZUG: $_playerName',
            textAlign: TextAlign.center, style: const TextStyle(
              color: Colors.white70, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Text('${(msRemaining / 1000).toStringAsFixed(1)} s',
            style: const TextStyle(color: Color(0xFFFFD56C),
              fontSize: 38, fontWeight: FontWeight.w900)),
          Text('PUNKTE: ${_scores[_turn]}',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          const Text('20 SEK. JE SPIELER • GLEICHE ZIELE • +3 BEI 10ER-COMBO',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 10)),
          const SizedBox(height: 12),
          Expanded(child: LayoutBuilder(builder: (context, c) {
            final size = Size(c.maxWidth, c.maxHeight);
            final diameter = math.min(120.0,
                size.shortestSide * SkillRules.duelTargetRatio);
            final target = _path.isEmpty ? const math.Point<double>(.5, .5) :
                _path[_targetIndex % _path.length];
            return ClipRRect(borderRadius: BorderRadius.circular(20),
              child: Listener(
                behavior: HitTestBehavior.opaque,
                onPointerDown: (event) => _tap(event, size),
                onPointerUp: (event) => _pointers.remove(event.pointer),
                onPointerCancel: (event) => _pointers.remove(event.pointer),
                child: Stack(children: [
                  const Positioned.fill(child: ColoredBox(color: Color(0xFF111C2E))),
                  if (active)
                    Positioned(
                      left: size.width * target.x - diameter / 2,
                      top: size.height * target.y - diameter / 2,
                      child: IgnorePointer(child: Container(
                        width: diameter, height: diameter,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const RadialGradient(colors: [
                            Color(0xFFFFE8A8), Color(0xFFF1A429),
                            Color(0xFFAB4D10)]),
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: widget.store.reducedEffects ? [] : const [
                            BoxShadow(color: Color(0x88FFD56C), blurRadius: 24),
                          ],
                        ),
                        child: const Icon(Icons.ads_click_rounded,
                          color: Color(0xFF2E251D), size: 30),
                      )),
                    ),
                  if (countdown) Center(child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('$_playerName',
                        style: const TextStyle(fontSize: 22,
                          fontWeight: FontWeight.w800)),
                      const SizedBox(height: 20),
                      Text('$_intro', style: const TextStyle(
                        fontSize: 96, fontWeight: FontWeight.w900,
                        color: Color(0xFFFFD56C))),
                    ],
                  )),
                  if (!active && !countdown) _panel(),
                ]),
              ),
            );
          })),
          const SizedBox(height: 10),
          const Text('SOLO PRACTICE DUEL • NICHT IN DER RANKED-RANGLISTE',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFFFC77E), fontSize: 10)),
          const SizedBox(height: 10),
        ]),
      )),
    );
  }
}
