import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../skins.dart';

class SkinButton extends StatefulWidget {
  const SkinButton({super.key, required this.skin, required this.size, this.pressed = false, this.label = 'TAP!'});
  final BattleSkin skin;
  final double size;
  final bool pressed;
  final String label;

  @override
  State<SkinButton> createState() => _SkinButtonState();
}

class _SkinButtonState extends State<SkinButton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 2800),
  )..repeat();

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _controller,
    builder: (context, _) {
      final skin = widget.skin;
      final t = _controller.value;
      final glow = (0.48 + 0.18 * math.sin(t * 2 * math.pi)).clamp(0.0, 1.0);
      return Transform.scale(
        scale: widget.pressed ? .93 : 1,
        child: SizedBox(
          width: widget.size, height: widget.size,
          child: CustomPaint(
            painter: _SkinAuraPainter(skin, t),
            child: Padding(
              padding: EdgeInsets.all(widget.size * .08),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    center: const Alignment(-.25, -.45), radius: 1.0,
                    colors: [skin.secondary, skin.primary, Color.lerp(skin.primary, Colors.black, .58)!],
                    stops: const [0.0, .44, 1],
                  ),
                  border: Border.all(color: skin.secondary.withValues(alpha: .95), width: widget.size * .024),
                  boxShadow: [
                    BoxShadow(color: skin.secondary.withValues(alpha: skin.isAnimated ? glow : .20),
                      blurRadius: widget.size * (skin.isAnimated ? .18 : .07),
                      spreadRadius: widget.size * .017),
                    BoxShadow(color: Colors.black.withValues(alpha: .45), blurRadius: 16, offset: const Offset(0, 8)),
                  ],
                ),
                alignment: Alignment.center,
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.bolt_rounded, color: Colors.white.withValues(alpha: .9), size: widget.size * .16),
                  Text(widget.label, style: TextStyle(fontWeight: FontWeight.w900,
                    fontSize: widget.size * .18, letterSpacing: 1.8, color: Colors.white,
                    shadows: const [Shadow(blurRadius: 8, color: Colors.black54)])),
                ]),
              ),
            ),
          ),
        ),
      );
    },
  );
}

class _SkinAuraPainter extends CustomPainter {
  const _SkinAuraPainter(this.skin, this.t);
  final BattleSkin skin;
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    if (!skin.isAnimated) return;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * .48;
    final accent = skin.secondary;
    final r = math.Random(skin.style + 157);
    final epic = skin.rarity == SkinRarity.epic;
    if (epic) {
      for (var i = 0; i < 2; i++) {
        final p = Paint()..color = accent.withValues(alpha: .5 - i * .12)
          ..style = PaintingStyle.stroke..strokeWidth = size.width * .014;
        final pulse = .90 + (t + i * .45) % 1 * .10;
        canvas.drawCircle(center, radius * pulse, p);
      }
    } else {
      for (var i = 0; i < 3; i++) {
        final sweep = math.pi * (.40 + .14 * i);
        final start = (t * 2 * math.pi * (i.isEven ? 1 : -1)) + i * 2.1;
        canvas.drawArc(Rect.fromCircle(center: center, radius: radius - i * 6),
          start, sweep, false, Paint()..color = accent.withValues(alpha: .75 - i * .13)
            ..style = PaintingStyle.stroke..strokeWidth = size.width * .016
            ..strokeCap = StrokeCap.round);
      }
    }
    final count = epic ? 11 : 25;
    for (var i = 0; i < count; i++) {
      final phi = i * (math.pi * 2 / count) + (epic ? 0 : t * math.pi);
      final drift = .85 + .18 * math.sin(t * 2 * math.pi + i * 1.4);
      final d = radius * drift;
      final p = Offset(center.dx + math.cos(phi) * d, center.dy + math.sin(phi) * d);
      final twinkle = .25 + .65 * (math.sin(t * 6.28 + i * 2).abs());
      canvas.drawCircle(p, size.width * (.006 + r.nextDouble() * .011),
        Paint()..color = accent.withValues(alpha: twinkle));
    }
    // Per-skin animated motifs: the effects differ in shape and movement,
    // not merely color. All effects are cosmetic and ignore pointer events.
    if (epic) {
      switch (skin.style) {
        case 0: // Neon Pulse: concentric waves
          for (var i = 0; i < 3; i++) {
            final phase = (t + i / 3) % 1;
            canvas.drawCircle(center, radius * (.48 + phase * .50), Paint()
              ..color = accent.withValues(alpha: .4 * (1 - phase))
              ..style = PaintingStyle.stroke..strokeWidth = size.width * .012);
          }
          break;
        case 1: // Inferno Core: hot embers flying upward
          for (var i = 0; i < 12; i++) {
            final phase = (t + i / 12) % 1;
            final x = center.dx + math.sin(i * 4.2) * radius * .7;
            final y = size.height * (1 - phase);
            canvas.drawCircle(Offset(x,y), 1.3 + i % 4,
              Paint()..color = Colors.orangeAccent.withValues(alpha: 1 - phase));
          }
          break;
        case 2: // Plasma Venom: oscillating plasma filaments
          for (var i = 0; i < 5; i++) {
            final angle = i * math.pi * .4 + t * math.pi * 2;
            final p0 = center + Offset(math.cos(angle), math.sin(angle)) * (radius * .55);
            final p1 = center + Offset(math.cos(angle + .55), math.sin(angle + .55)) * radius;
            canvas.drawLine(p0, p1, Paint()..color = accent.withValues(alpha: .75)
              ..strokeWidth = 1.7);
          }
          break;
        case 3: // Thunder Violet: zigzag lightning around the rim
          for (var i = 0; i < 4; i++) {
            final phi = t * math.pi * 2 + i * math.pi / 2;
            final a = center + Offset(math.cos(phi), math.sin(phi)) * radius * .75;
            final b = center + Offset(math.cos(phi + .3), math.sin(phi + .3)) * radius * 1.1;
            final mid = Offset((a.dx + b.dx) / 2 + math.sin(t * 19 + i) * 8,
              (a.dy + b.dy) / 2 + math.cos(t * 17 + i) * 8);
            canvas.drawPath(Path()..moveTo(a.dx,a.dy)..lineTo(mid.dx,mid.dy)..lineTo(b.dx,b.dy),
              Paint()..color = accent.withValues(alpha: .85)..strokeWidth = 2
                ..style = PaintingStyle.stroke);
          }
          break;
        case 4: // Frozen Prism: orbiting ice crystals
          for (var i = 0; i < 8; i++) {
            final phi = i * math.pi / 4 + t * math.pi / 3;
            final p = center + Offset(math.cos(phi), math.sin(phi)) * radius * .90;
            canvas.drawPath(Path()..moveTo(p.dx,p.dy-5)..lineTo(p.dx+3,p.dy)
                ..lineTo(p.dx,p.dy+5)..lineTo(p.dx-3,p.dy)..close(),
              Paint()..color = Colors.white.withValues(alpha: .8));
          }
          break;
      }
    } else {
      switch (skin.style) {
        case 0: // Solar Deity: rotating sunbeams
          for (var i = 0; i < 16; i++) {
            final angle = i * math.pi / 8 + t * math.pi * 2;
            final a = center + Offset(math.cos(angle), math.sin(angle)) * radius * .80;
            final b = center + Offset(math.cos(angle), math.sin(angle)) * radius * 1.06;
            canvas.drawLine(a,b,Paint()..color = accent.withValues(alpha: .85)..strokeWidth = 2.3);
          }
          break;
        case 1: // Void Dragon: purple winding magical trail
          final path = Path();
          for (var i = 0; i <= 48; i++) {
            final progress = i / 48;
            final angle = progress * math.pi * 4 + t * math.pi * 2;
            final d = radius * (.22 + progress * .72);
            final p = center + Offset(math.cos(angle), math.sin(angle)) * d;
            if (i == 0) { path.moveTo(p.dx,p.dy); } else { path.lineTo(p.dx,p.dy); }
          }
          canvas.drawPath(path, Paint()..color = accent.withValues(alpha: .5)
            ..style = PaintingStyle.stroke..strokeWidth = 2.2);
          break;
        case 2: // Phoenix Heart: upward-flowing embers
          for (var i = 0; i < 18; i++) {
            final phase = (t + i / 18) % 1;
            final x = center.dx + math.sin(phase * 7 + i) * radius * .60;
            final y = size.height * (1 - phase);
            canvas.drawCircle(Offset(x, y), 1.5 + i % 4,
              Paint()..color = Colors.orangeAccent.withValues(alpha: .7 * (1 - phase)));
          }
          break;
        case 3: // Celestial Crown: orbiting diamond fragments
          for (var i = 0; i < 9; i++) {
            final phi = i * math.pi * 2 / 9 - t * math.pi;
            final p = center + Offset(math.cos(phi), math.sin(phi)) * radius * .98;
            canvas.drawPath(Path()..moveTo(p.dx,p.dy-6)..lineTo(p.dx+5,p.dy)
              ..lineTo(p.dx,p.dy+6)..lineTo(p.dx-5,p.dy)..close(),
              Paint()..color = accent.withValues(alpha: .78));
          }
          break;
        case 4: // Cosmic Singularity: drifting spiral stars
          for (var i = 0; i < 45; i++) {
            final angle = i * .78 + t * math.pi * 4;
            final d = radius * (.1 + (i / 45) * .9);
            final p = center + Offset(math.cos(angle), math.sin(angle)) * d;
            canvas.drawCircle(p, 1.0 + i % 3,
              Paint()..color = i.isEven ? accent : Colors.white.withValues(alpha: .8));
          }
          break;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SkinAuraPainter oldDelegate) => oldDelegate.skin != skin || oldDelegate.t != t;
}
