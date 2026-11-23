import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'battle_audio.dart';
import 'battle_design.dart';
import 'local_store.dart';
import 'skill_rules.dart';

enum _SkillPhase { ready, preview, memoryInput, timing, done, interrupted }

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
  int _lives = SkillRules.memoryMaxLives;
  int _memoryIndex = 0;
  int _previewStep = 0;
  int _litCell = -1;
  int _selectedCell = -1;

  // Timing Strike: exactly ten attempts, gradually faster moving marker.
  int _attempts = 0;
  double _target = .5;
  int _lastShotMs = -9999;
  int? _tapPointer;
  double? _lastTapPosition;
  double? _lastTapTarget;
  int _lastTapPoints = 0;

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
        _phase == _SkillPhase.timing) {
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
    _lives = SkillRules.memoryMaxLives;
    _sequence.clear();
    _memoryIndex = 0;
    _litCell = -1;
    _selectedCell = -1;
    _attempts = 0;
    _lastShotMs = -9999;
    _lastTapPosition = null;
    _lastTapTarget = null;
    _lastTapPoints = 0;
    _tapPointer = null;
    _target = .25 + _rng.nextDouble() * .5;
    _audio.start();
    if (widget.mode == SkillMode.memoryMatrix) {
      _startMemoryLevel();
    } else {
      _clock.start();
      _phase = _SkillPhase.timing;
      _timer = Timer.periodic(const Duration(milliseconds: 33), (_) {
        if (!mounted) return;
        if (_clock.elapsed >= SkillRules.timingDuration) {
          _finish();
          return;
        }
        setState(() {});
      });
      setState(() {});
    }
  }

  void _startMemoryLevel() {
    if (!mounted) return;
    while (_sequence.length < SkillRules.memorySteps(_level)) {
      final cells = SkillRules.memoryCellCount(_level);
      var tile = _rng.nextInt(cells);
      if (_sequence.isNotEmpty && tile == _sequence.last) tile = (tile + 1) % cells;
      _sequence.add(tile);
    }
    _phase = _SkillPhase.preview;
    _status = 'Präge dir die Reihenfolge ein';
    _litCell = -1;
    _selectedCell = -1;
    _memoryIndex = 0;
    _previewStep = 0;
    _previewTimer?.cancel();
    _previewTimer = Timer.periodic(SkillRules.memoryFlashInterval(_level), (timer) {
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
      _lives--;
      _audio.miss();
      if (_lives <= 0) {
        _status = 'Keine Leben mehr – versuche es erneut!';
        _finish();
      } else {
        _phase = _SkillPhase.preview;
        _status = 'Falsches Feld – Sequenz wird wiederholt!';
        _nextLevelTimer?.cancel();
        _nextLevelTimer = Timer(const Duration(milliseconds: 750),
            _startMemoryLevel);
        if (mounted) setState(() {});
      }
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
        _status = 'Alle 20 Stufen geschafft!';
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
    final tapPosition = _cursor(ms);
    final targetAtTap = _target;
    final points = SkillRules.timingPoints(tapPosition, targetAtTap);
    _lastTapPosition = tapPosition;
    _lastTapTarget = targetAtTap;
    _lastTapPoints = points;
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
    _record = widget.store.saveSkillRound(
        mode: widget.mode, score: _score, hits: _hits,
        level: widget.mode == SkillMode.memoryMatrix ? _level : null);
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
    const SizedBox(height: 7),
    Text('LEBEN: ${'♥ ' * _lives}${'♡ ' * (SkillRules.memoryMaxLives - _lives)}',
      style: const TextStyle(fontWeight: FontWeight.w900,
        color: BattleColors.red, fontSize: 15)),
    const SizedBox(height: 7),
    Text('EINGABE $_memoryIndex / ${_sequence.length}',
      style: const TextStyle(color: Colors.white60, fontSize: 12)),
    const SizedBox(height: 9),
    Text(_status, textAlign: TextAlign.center,
      style: const TextStyle(color: Colors.white70)),
    const SizedBox(height: 20),
    Expanded(child: Center(child: AspectRatio(aspectRatio: 1,
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(8),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: SkillRules.memoryColumnsForLevel(_level),
          crossAxisSpacing: _level >= 15 ? 5 : 10,
          mainAxisSpacing: _level >= 15 ? 5 : 10),
        itemCount: SkillRules.memoryCellCount(_level),
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
                  size: _level >= 15 ? 21 : _level >= 8 ? 25 : 30,
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
              if (_lastTapTarget != null)
                Positioned(
                  left: math.max(0.0, width * (_lastTapTarget! - .08)),
                  top: 7, bottom: 7, width: width * .16,
                  child: IgnorePointer(child: Container(decoration: BoxDecoration(
                    color: BattleColors.green.withValues(alpha: .13),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: BattleColors.green.withValues(alpha: .5)),
                  ))),
                ),
              Positioned(
                left: math.max(0.0, width * (_target - .08)),
                top: 4, bottom: 4, width: width * .16,
                child: Container(decoration: BoxDecoration(
                  color: const Color(0xFF1CB982),
                  borderRadius: BorderRadius.circular(12),
                )),
              ),
              Positioned(left: width * cursor - 4, top: 0, bottom: 0,
                child: Container(width: 8, decoration: BoxDecoration(
                  color: const Color(0xFFFFD56C),
                  borderRadius: BorderRadius.circular(5),
                  boxShadow: widget.store.reducedEffects ? [] : const [
                    BoxShadow(color: Color(0xAAFFD56C), blurRadius: 12),
                  ],
                ))),
              if (_lastTapPosition != null)
                Positioned(left: math.max(0.0, width * _lastTapPosition! - 9),
                  top: 11, bottom: 11,
                  child: IgnorePointer(child: Container(
                    width: 18,
                    decoration: BoxDecoration(
                      color: BattleColors.background,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: Colors.white, width: 3),
                    ),
                  )),
                ),
            ]),
          ),
          const SizedBox(height: 16),
          if (_lastTapPosition != null) ...[
            Text('LETZTER STOPP: $_lastTapPoints / 100 PUNKTE',
              style: TextStyle(
                color: _lastTapPoints >= 50 ? BattleColors.green
                    : BattleColors.red,
                fontWeight: FontWeight.w900,
                fontSize: 15,
              )),
            const SizedBox(height: 6),
            const Text('Weisser Marker = Position beim letzten Tap',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 11)),
            const SizedBox(height: 8),
          ],
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
                  '${widget.mode == SkillMode.memoryMatrix ? 'Erreichte Stufe: $_level / ${SkillRules.memoryMaxLevel}\n' : ''}'
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
        _phase == _SkillPhase.memoryInput || _phase == _SkillPhase.timing;
    return Scaffold(
      appBar: AppBar(title: Text(widget.mode.title), centerTitle: true),
      body: SafeArea(child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(children: [
          BattleSurface(
            accent: memory ? const Color(0xFFB6A1FF) : BattleColors.gold,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            child: Column(children: [
              Text(widget.mode.description, textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 8),
              Text(memory
                  ? 'LEVEL $_level / ${SkillRules.memoryMaxLevel}'
                  : '${_attempts} / ${SkillRules.timingAttempts} SCHÜSSE',
                style: const TextStyle(
                  fontSize: 29, color: BattleColors.gold,
                  fontWeight: FontWeight.w900)),
              Text('$_score ${widget.mode.unit}',
                style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text('PERSÖNLICHER BESTWERT: ${widget.store.skillBest(widget.mode) ?? '—'}'
                  '${memory ? '  •  STUFE ${widget.store.memoryBestLevel}' : ''}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: BattleColors.cyan, fontSize: 11,
                  fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              const Text('LOKALER MODUS • KEINE ONLINE-RANGLISTE',
                style: TextStyle(color: BattleColors.mutedText, fontSize: 10)),
            ]),
          ),
          const SizedBox(height: 10),
          Expanded(child: LayoutBuilder(builder: (context, constraints) {
            final size = Size(constraints.maxWidth, constraints.maxHeight);
            return ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(children: [
                Positioned.fill(child: BattleArena(
                  accent: memory ? const Color(0xFFB6A1FF) : BattleColors.gold,
                )),
                if (memory) Positioned.fill(child: _memoryBoard()),
                if (!memory && active)
                  Positioned.fill(child: _timingBoard(size)),
                if (!active) _overlay(),
              ]),
            );
          })),
          const SizedBox(height: 10),
          Text('BESTWERT: ${widget.store.skillBest(widget.mode) ?? '—'} '
              '${widget.mode.unit}',
            style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 9),
        ]),
      )),
    );
  }
}
