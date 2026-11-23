import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'battle_audio.dart';
import 'battle_design.dart';
import 'local_store.dart';
import 'skill_rules.dart';

enum _SkillPhase { ready, preview, memoryInput, precision, timing, done, interrupted }

class SkillPage extends StatefulWidget {
  const SkillPage({super.key, required this.mode, required this.store});
  final SkillMode mode;
  final PracticeStore store;

  @override
  State<SkillPage> createState() => _SkillPageState();
}

class _SkillPageState extends State<SkillPage> with WidgetsBindingObserver {
  final math.Random _rng = math.Random.secure();
  late final BattleAudio _audio = BattleAudio(widget.store);
  final Stopwatch _clock = Stopwatch();
  Timer? _timer;
  Timer? _previewTimer;
  Timer? _nextLevelTimer;
  _SkillPhase _phase = _SkillPhase.ready;
  int _score = 0;
  int _hits = 0;
  int _mistakes = 0;
  bool _record = false;
  String _status = '';

  // Memory Matrix: progressive, non-repeating adjacent cells.
  final List<int> _sequence = [];
  int _level = 1;
  int _memoryIndex = 0;
  int _previewStep = 0;
  int _litCell = -1;
  int _selectedCell = -1;

  // Precision Trail: positional proximity sampled at a constant 33ms cadence.
  final List<Offset> _trail = [];
  Offset? _finger;
  int? _fingerId;
  int _samples = 0;
  int _tracked = 0;

  // Timing Strike: exactly ten attempts, gradually faster moving marker.
  int _attempts = 0;
  double _target = .5;
  int _lastShotMs = -9999;
  int? _tapPointer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_audio.preload());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) return;
    if (_phase == _SkillPhase.preview || _phase == _SkillPhase.memoryInput ||
        _phase == _SkillPhase.precision || _phase == _SkillPhase.timing) {
      _cancelTimers();
      _clock.stop();
      widget.store.flushTapCount();
      if (mounted) setState(() {
        _phase = _SkillPhase.interrupted;
        _status = 'Die App wurde unterbrochen. Bitte starte eine neue Runde.';
      });
    }
  }

  void _cancelTimers() {
    _timer?.cancel();
    _previewTimer?.cancel();
    _nextLevelTimer?.cancel();
  }

  void _start() {
    _cancelTimers();
    _clock..stop()..reset();
    _score = 0;
    _hits = 0;
    _mistakes = 0;
    _record = false;
    _level = 1;
    _sequence.clear();
    _memoryIndex = 0;
    _litCell = -1;
    _selectedCell = -1;
    _finger = null;
    _fingerId = null;
    _trail.clear();
    _samples = 0;
    _tracked = 0;
    _attempts = 0;
    _lastShotMs = -9999;
    _tapPointer = null;
    _target = .25 + _rng.nextDouble() * .5;
    _audio.start();
    if (widget.mode == SkillMode.memoryMatrix) {
      _startMemoryLevel();
    } else {
      _clock.start();
      _phase = widget.mode == SkillMode.precisionTrail
          ? _SkillPhase.precision : _SkillPhase.timing;
      _timer = Timer.periodic(const Duration(milliseconds: 33), (_) {
        if (!mounted) return;
        if (_clock.elapsed >= SkillRules.precisionDuration) {
          _finish();
          return;
        }
        if (_phase == _SkillPhase.precision) _precisionSample();
        setState(() {});
      });
      setState(() {});
    }
  }

  void _startMemoryLevel() {
    if (!mounted) return;
    while (_sequence.length < SkillRules.memorySteps(_level)) {
      var tile = _rng.nextInt(9);
      if (_sequence.isNotEmpty && tile == _sequence.last) tile = (tile + 1) % 9;
      _sequence.add(tile);
    }
    _phase = _SkillPhase.preview;
    _status = 'Präge dir die Reihenfolge ein';
    _litCell = -1;
    _selectedCell = -1;
    _memoryIndex = 0;
    _previewStep = 0;
    _previewTimer?.cancel();
    _previewTimer = Timer.periodic(const Duration(milliseconds: 350), (timer) {
      if (!mounted || _phase != _SkillPhase.preview) {
        timer.cancel();
        return;
      }
      if (_litCell >= 0) {
        _litCell = -1;
        _previewStep++;
        if (_previewStep >= _sequence.length) {
          timer.cancel();
          _phase = _SkillPhase.memoryInput;
          _status = 'Jetzt bist du dran!';
        }
      } else {
        _litCell = _sequence[_previewStep];
      }
      setState(() {});
    });
    setState(() {});
  }

  void _tapMemory(int tile) {
    if (_phase != _SkillPhase.memoryInput) return;
    widget.store.registerTap();
    _selectedCell = tile;
    if (tile != _sequence[_memoryIndex]) {
      _mistakes++;
      _audio.miss();
      _status = 'Falsches Feld!';
      _finish();
      return;
    }
    _audio.tap(hits: ++_hits, combo: _memoryIndex + 1, hitsPerSecond: 3);
    if (widget.store.vibrationEnabled) HapticFeedback.selectionClick();
    _score++;
    _memoryIndex++;
    if (_memoryIndex == _sequence.length) {
      _score += 2;
      _audio.combo();
      if (_level == SkillRules.memoryMaxLevel) {
        _status = 'Alle zehn Stufen geschafft!';
        _finish();
      } else {
        _level++;
        _phase = _SkillPhase.preview;
        _status = 'Richtig! Nächste Stufe';
        _nextLevelTimer?.cancel();
        _nextLevelTimer = Timer(const Duration(milliseconds: 650), _startMemoryLevel);
      }
    }
    setState(() {});
  }

  Offset _trailPoint(int ms) {
    final seconds = ms / 1000;
    return Offset(
      .5 + .34 * math.sin(seconds * 1.22),
      .5 + .32 * math.sin(seconds * .88 + 1.25),
    );
  }

  void _precisionSample() {
    final p = _trailPoint(_clock.elapsedMilliseconds);
    _trail.add(p);
    if (_trail.length > 40) _trail.removeAt(0);
    _samples++;
    // The player must actively keep one finger near the moving point.
    if (_finger != null && _fieldSize != Size.zero) {
      final point = Offset(p.dx * _fieldSize.width, p.dy * _fieldSize.height);
      final tolerance = math.max(27.0, _fieldSize.shortestSide * .105);
      if ((point - _finger!).distance <= tolerance) _tracked++;
    }
    _score = SkillRules.trackingAccuracy(_tracked, _samples);
  }

  Size _fieldSize = Size.zero;

  double _cursor(int ms) {
    final shot = _attempts;
    return .5 + .45 * math.sin(ms * 2 * math.pi /
        SkillRules.timingPeriodMs(shot));
  }

  void _tapTiming() {
    if (_phase != _SkillPhase.timing) return;
    final ms = _clock.elapsedMilliseconds;
    if (ms - _lastShotMs < 250) return;
    _lastShotMs = ms;
    widget.store.registerTap();
    final points = SkillRules.timingPoints(_cursor(ms), _target);
    _score += points;
    _attempts++;
    if (points > 0) {
      _hits++;
      _audio.tap(hits: _hits, combo: _hits, hitsPerSecond: 3);
      if (widget.store.vibrationEnabled) HapticFeedback.selectionClick();
    } else {
      _mistakes++;
      _audio.miss();
    }
    _status = '$points Punkte für diesen Treffer';
    if (_attempts >= SkillRules.timingAttempts) {
      _finish();
    } else {
      _target = .24 + _rng.nextDouble() * .52;
      setState(() {});
    }
  }

  void _finish() {
    if (_phase == _SkillPhase.done || _phase == _SkillPhase.interrupted) return;
    _cancelTimers();
    _clock.stop();
    _finger = null;
    _fingerId = null;
    _record = widget.store.saveSkillRound(
        mode: widget.mode, score: _score, hits: _hits);
    _audio.stop();
    if (_record) _audio.record();
    if (mounted) setState(() => _phase = _SkillPhase.done);
  }

  @override
  void dispose() {
    _cancelTimers();
    _clock.stop();
    widget.store.flushTapCount();
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_audio.dispose());
    super.dispose();
  }

  Widget _memoryBoard() => Column(children: [
    const SizedBox(height: 18),
    Text('STUFE $_level / ${SkillRules.memoryMaxLevel}',
      style: const TextStyle(color: Color(0xFFFFD56C), fontSize: 18,
        fontWeight: FontWeight.w900)),
    const SizedBox(height: 12),
    Text(_status, style: const TextStyle(color: Colors.white70)),
    const SizedBox(height: 20),
    Expanded(child: Center(child: AspectRatio(aspectRatio: 1,
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(8),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10),
        itemCount: 9,
        itemBuilder: (_, i) {
          final lit = _phase == _SkillPhase.preview && _litCell == i;
          final selected = _phase == _SkillPhase.memoryInput && _selectedCell == i;
          final color = lit ? const Color(0xFFFFDA72)
              : selected ? const Color(0xFF2CB987) : const Color(0xFF22314A);
          return Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: _phase == _SkillPhase.memoryInput
                  ? () => _tapMemory(i) : null,
              child: AnimatedContainer(
                duration: widget.store.reducedEffects ? Duration.zero
                    : const Duration(milliseconds: 150),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [color, Color.lerp(color, BattleColors.elevated, .24)!],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: lit ? BattleColors.gold.withValues(alpha: .93)
                        : selected ? BattleColors.green : BattleColors.border,
                    width: lit ? 2.2 : 1,
                  ),
                  boxShadow: lit && !widget.store.reducedEffects
                      ? [BoxShadow(color: BattleColors.gold.withValues(alpha: .26),
                          blurRadius: 18)] : const [],
                ),
                child: Center(child: Icon(
                  lit ? Icons.lightbulb : Icons.circle_outlined,
                  color: lit ? const Color(0xFF151B28) : Colors.white38,
                  size: 30,
                )),
              ),
            ),
          );
        },
      ),
    ))),
    const SizedBox(height: 16),
    const Text('Beobachten → Merken → Nachspielen',
      style: TextStyle(color: Colors.white54)),
    const SizedBox(height: 12),
  ]);

  Widget _precisionBoard(Size size) {
    final p = _trailPoint(_clock.elapsedMilliseconds);
    final target = Offset(p.dx * size.width, p.dy * size.height);
    final good = _finger != null && (target - _finger!).distance <=
        math.max(27.0, size.shortestSide * .105);
    return Listener(
      behavior: HitTestBehavior.opaque,
      onPointerDown: (event) {
        if (_phase != _SkillPhase.precision || _fingerId != null) return;
        _fingerId = event.pointer;
        _finger = event.localPosition;
        widget.store.registerTap();
        setState(() {});
      },
      onPointerMove: (event) {
        if (_phase != _SkillPhase.precision || event.pointer != _fingerId) return;
        _finger = event.localPosition;
        setState(() {});
      },
      onPointerUp: (event) {
        if (event.pointer == _fingerId) {
          _finger = null;
          _fingerId = null;
          setState(() {});
        }
      },
      onPointerCancel: (event) {
        if (event.pointer == _fingerId) {
          _finger = null;
          _fingerId = null;
          setState(() {});
        }
      },
      child: Stack(children: [
        Positioned.fill(child: CustomPaint(painter: _TrailPainter(_trail))),
        Positioned(left: target.dx - 27, top: target.dy - 27,
          child: IgnorePointer(child: Container(width: 54, height: 54,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: good ? const Color(0xFF69F3C1) : const Color(0xFF53C5FF),
              border: Border.all(width: 4, color: Colors.white),
              boxShadow: widget.store.reducedEffects ? [] : const [
                BoxShadow(color: Color(0x8853C5FF), blurRadius: 22, spreadRadius: 4),
              ],
            ),
            child: const Icon(Icons.my_location, color: Color(0xFF112338), size: 24),
          ))),
        const Positioned(left: 12, right: 12, bottom: 14,
          child: Text('Finger auf den Lichtpunkt legen und ihm folgen',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, fontSize: 12))),
      ]),
    );
  }

  Widget _timingBoard(Size size) {
    final cursor = _cursor(_clock.elapsedMilliseconds);
    final width = size.width * .88;
    return Listener(
      behavior: HitTestBehavior.opaque,
      onPointerDown: (event) {
        if (_tapPointer != null) return;
        _tapPointer = event.pointer;
        _tapTiming();
      },
      onPointerUp: (event) {
        if (_tapPointer == event.pointer) _tapPointer = null;
      },
      onPointerCancel: (event) {
        if (_tapPointer == event.pointer) _tapPointer = null;
      },
      child: Stack(children: [
        Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('SCHUSS ${math.min(_attempts + 1, SkillRules.timingAttempts)} / '
              '${SkillRules.timingAttempts}', style: const TextStyle(
                fontSize: 19, fontWeight: FontWeight.w900,
                color: Color(0xFFFFD56C))),
          const SizedBox(height: 26),
          SizedBox(width: width, height: 76,
            child: Stack(children: [
              Positioned.fill(child: Container(decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                color: const Color(0xFF23314D),
                border: Border.all(color: Colors.white30, width: 2),
              ))),
              Positioned(left: math.max(0.0, width * (_target - .08)),
                top: 4, bottom: 4, width: width * .16,
                child: Container(decoration: BoxDecoration(
                  color: const Color(0xFF1CB982),
                  borderRadius: BorderRadius.circular(12),
                ))),
              Positioned(left: width * cursor - 4, top: 0, bottom: 0,
                child: Container(width: 8, decoration: BoxDecoration(
                  color: const Color(0xFFFFD56C),
                  borderRadius: BorderRadius.circular(5),
                  boxShadow: widget.store.reducedEffects ? [] : const [
                    BoxShadow(color: Color(0xAAFFD56C), blurRadius: 12),
                  ],
                ))),
            ]),
          ),
          const SizedBox(height: 24),
          Text(_status.isEmpty ? 'Tippe, wenn die gelbe Linie den grünen Bereich erreicht'
              : _status, textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70)),
        ])),
        const Positioned(left: 0, right: 0, bottom: 20,
          child: Text('ÜBERALL TIPPEN, UM DEN SCHUSS AUSZULÖSEN',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 11))),
      ]),
    );
  }

  Widget _overlay() {
    final finished = _phase == _SkillPhase.done;
    final error = _phase == _SkillPhase.interrupted;
    final best = widget.store.skillBest(widget.mode);
    return Positioned.fill(child: Container(
      color: const Color(0xEA0B1220),
      alignment: Alignment.center,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(finished ? Icons.emoji_events_rounded : Icons.sports_esports,
            color: const Color(0xFFFFD56C), size: 65),
          const SizedBox(height: 12),
          Text(finished ? 'RUNDE BEENDET' : error ? 'UNTERBROCHEN' : 'BEREIT?',
            style: const TextStyle(fontSize: 27, color: Color(0xFFFFD56C),
              fontWeight: FontWeight.w900)),
          const SizedBox(height: 14),
          Text(finished
              ? '$_score ${widget.mode.unit}\n'
                  '$_hits Treffer • $_mistakes Fehler\n'
                  '${_record ? '🏆 NEUER BESTWERT!' : 'Bestwert: ${best ?? '—'}'}'
              : error ? _status : widget.mode.description,
            textAlign: TextAlign.center,
            style: const TextStyle(height: 1.6, color: Colors.white70)),
          const SizedBox(height: 24),
          FilledButton(onPressed: _start,
            child: Text(finished ? 'NOCHMAL SPIELEN' : 'STARTEN')),
        ]),
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final memory = widget.mode == SkillMode.memoryMatrix;
    final active = _phase == _SkillPhase.preview ||
        _phase == _SkillPhase.memoryInput || _phase == _SkillPhase.precision ||
        _phase == _SkillPhase.timing;
    final remaining = (SkillRules.precisionDuration.inMilliseconds -
        _clock.elapsedMilliseconds).clamp(0, SkillRules.precisionDuration.inMilliseconds);
    return Scaffold(
      appBar: AppBar(title: Text(widget.mode.title), centerTitle: true),
      body: SafeArea(child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(children: [
          BattleSurface(
            accent: widget.mode == SkillMode.memoryMatrix
                ? const Color(0xFFB6A1FF)
                : widget.mode == SkillMode.precisionTrail
                    ? BattleColors.cyan : BattleColors.gold,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            child: Column(children: [
          Text(widget.mode.description, textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white60, fontSize: 12)),
          const SizedBox(height: 12),
          Text(memory ? 'LEVEL $_level' :
              widget.mode == SkillMode.precisionTrail
                ? '${(remaining / 1000).toStringAsFixed(1)} s' :
                  '${_attempts} / ${SkillRules.timingAttempts} SCHÜSSE',
            style: const TextStyle(fontSize: 32, color: Color(0xFFFFD56C),
              fontWeight: FontWeight.w900)),
          Text('$_score ${widget.mode.unit}', style: const TextStyle(
            fontSize: 21, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('LOCAL ARCADE • KEINE ONLINE-RANGLISTE',
            style: TextStyle(color: Color(0xFFFFC77E), fontSize: 10)),
            ]),
          ),
          const SizedBox(height: 10),
          Expanded(child: LayoutBuilder(builder: (context, constraints) {
            final size = Size(constraints.maxWidth, constraints.maxHeight);
            _fieldSize = size;
            return ClipRRect(borderRadius: BorderRadius.circular(20),
              child: Stack(children: [
                Positioned.fill(child: BattleArena(
                  accent: widget.mode == SkillMode.memoryMatrix
                      ? const Color(0xFFB6A1FF)
                      : widget.mode == SkillMode.precisionTrail
                          ? BattleColors.cyan : BattleColors.gold,
                )),
                if (memory) Positioned.fill(child: _memoryBoard()),
                if (!memory && active && widget.mode == SkillMode.precisionTrail)
                  Positioned.fill(child: _precisionBoard(size)),
                if (!memory && active && widget.mode == SkillMode.timingStrike)
                  Positioned.fill(child: _timingBoard(size)),
                if (!active) _overlay(),
              ]),
            );
          })),
          const SizedBox(height: 12),
          Text('BESTWERT: ${widget.store.skillBest(widget.mode) ?? '—'} '
              '${widget.mode.unit}', style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 12),
        ]),
      )),
    );
  }
}

class _TrailPainter extends CustomPainter {
  const _TrailPainter(this.trail);
  final List<Offset> trail;

  @override
  void paint(Canvas canvas, Size size) {
    if (trail.length < 2) return;
    final path = Path()..moveTo(trail.first.dx * size.width,
        trail.first.dy * size.height);
    for (final point in trail.skip(1)) {
      path.lineTo(point.dx * size.width, point.dy * size.height);
    }
    canvas.drawPath(path, Paint()
      ..color = const Color(0xCC3AA8E7)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round);
  }

  @override
  bool shouldRepaint(covariant _TrailPainter oldDelegate) => true;
}
