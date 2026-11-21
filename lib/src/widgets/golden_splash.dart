import 'dart:math' as math;
import 'package:flutter/material.dart';

class GoldenSplash extends StatefulWidget {
  const GoldenSplash({super.key, required this.score, required this.onDone, this.preview = false});
  final int score;
  final VoidCallback onDone;
  final bool preview;
  @override
  State<GoldenSplash> createState() => _GoldenSplashState();
}

class _GoldenSplashState extends State<GoldenSplash> with SingleTickerProviderStateMixin {
  late final AnimationController controller = AnimationController(vsync: this,
    duration: const Duration(milliseconds: 3200))
    ..forward().whenComplete(widget.onDone);
  @override
  void dispose() { controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Positioned.fill(
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onDone,
      child: AnimatedBuilder(animation: controller, builder: (context, child) => Stack(children: [
        Positioned.fill(child: CustomPaint(painter: _GoldPainter(controller.value))),
        Center(child: Opacity(opacity: (controller.value * 8).clamp(0, 1).toDouble(),
          child: Transform.scale(scale: .7 + .3 * (1 - math.pow(1 - controller.value, 4).toDouble()),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.emoji_events_rounded, size: 74, color: Color(0xFFFFDC69)),
              const Text('NEW RECORD!', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900,
                color: Color(0xFFFFD55B), letterSpacing: 2, shadows: [Shadow(color: Colors.black, blurRadius: 14)])),
              Text('${widget.score}', style: const TextStyle(fontSize: 74, fontWeight: FontWeight.w900,
                color: Colors.white, shadows: [Shadow(color: Colors.black, blurRadius: 16)])),
              if (widget.preview) const Text('PRACTICE PREVIEW', style: TextStyle(color: Colors.white70)),
            ])))),
        const Positioned(bottom: 54, left: 0, right: 0,
          child: Text('TAP TO SKIP', textAlign: TextAlign.center,
            style: TextStyle(letterSpacing: 2, color: Colors.white70, fontSize: 11))),
      ])),
    ),
  );
}

class _GoldPainter extends CustomPainter {
  const _GoldPainter(this.t);
  final double t;
  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = Colors.black.withValues(alpha: .33 * (1 - t * .5));
    canvas.drawRect(Offset.zero & size, bg);
    final rng = math.Random(4404);
    final gravity = size.height * .72;
    // Liquid-like fan sprays from the bottom corners and the screen edges.
    for (var i = 0; i < 110; i++) {
      final left = i.isEven;
      final origin = Offset(left ? -18 : size.width + 18, size.height * (.25 + rng.nextDouble() * .65));
      final angle = (left ? -0.8 : math.pi + .8) + (rng.nextDouble() - .5) * 1.7;
      final speed = (80 + rng.nextDouble() * size.width * .9);
      final elapsed = t * 2.6;
      final x = origin.dx + math.cos(angle) * speed * elapsed;
      final y = origin.dy + math.sin(angle) * speed * elapsed + gravity * elapsed * elapsed * .28;
      final p = Paint()..color = Color.lerp(const Color(0xFFF3A718), const Color(0xFFFFF2A1), rng.nextDouble())!
        .withValues(alpha: (.9 * (1 - t * .8)).clamp(0.0, 1.0).toDouble());
      canvas.drawCircle(Offset(x, y), 1.5 + rng.nextDouble() * 6, p);
      if (i % 4 == 0) {
        final path = Path()..moveTo(origin.dx, origin.dy)
          ..quadraticBezierTo((origin.dx + x) / 2, y - speed * .23, x, y);
        canvas.drawPath(path, Paint()..color = p.color.withValues(alpha: .28)
          ..style = PaintingStyle.stroke..strokeWidth = 1.2 + rng.nextDouble() * 2.8
          ..strokeCap = StrokeCap.round);
      }
    }
    // Gold confetti and sparkles shower down over the full viewport.
    for (var i = 0; i < 130; i++) {
      final x = rng.nextDouble() * size.width;
      final y = (rng.nextDouble() * size.height + t * size.height * (1 + rng.nextDouble())) % size.height;
      final color = i.isEven ? const Color(0xFFFFD15B) : const Color(0xFFFFF7C5);
      final paint = Paint()..color = color.withValues(alpha: (.8 * (1 - .6 * t)).clamp(0.0, 1.0).toDouble());
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(t * 9 + i);
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, 2 + i % 4, 4 + i % 7),
        const Radius.circular(1)), paint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _GoldPainter oldDelegate) => oldDelegate.t != t;
}
