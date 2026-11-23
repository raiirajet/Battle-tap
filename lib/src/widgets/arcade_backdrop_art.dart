import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Original, resolution-independent artwork for the Battle Tap background.
///
/// The details live primarily on the *edges* of the viewport. The central
/// reading lane stays close to midnight navy, keeping headings, cards and
/// form fields legible. The artwork never animates or intercepts pointers.
class ArcadeBackdropArt extends StatelessWidget {
  const ArcadeBackdropArt({super.key});

  @override
  Widget build(BuildContext context) => const RepaintBoundary(
    child: CustomPaint(painter: ArcadeBackdropPainter()),
  );
}

class ArcadeBackdropPainter extends CustomPainter {
  const ArcadeBackdropPainter();

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) return;

    final w = size.width;
    final h = size.height;
    final shortest = math.min(w, h);
    canvas.save();
    canvas.clipRect(Offset.zero & size);

    // Deep, low-contrast edge lighting. No photography or bright patches
    // behind the centre column.
    _glow(canvas, Offset(w * 1.02, h * .05),
        math.max(shortest * .75, h * .38),
        const Color(0xFF4776A9), .23);
    _glow(canvas, Offset(-w * .15, h * .64),
        math.max(shortest * .80, h * .38),
        const Color(0xFF19A4C3), .13);
    _glow(canvas, Offset(w * .92, h * .98),
        math.max(shortest * .62, h * .34),
        const Color(0xFFD1A357), .115);

    // Concentric arcade radar arcs, partially off-screen. The thin strokes
    // create an intentional premium-gaming motif without busying the UI.
    _radar(canvas, Offset(w * 1.14, h * .19),
        shortest * .52, const Color(0xFF75BADD));
    _radar(canvas, Offset(-w * .27, h * .86),
        shortest * .54, const Color(0xFFCFAE70));

    // PCB/arena-circuit lines are concentrated in the outer margins.
    final cool = Paint()
      ..color = const Color(0xFF69CCF6).withValues(alpha: .11)
      ..strokeWidth = 1.05
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final warm = Paint()
      ..color = const Color(0xFFFFD56C).withValues(alpha: .095)
      ..strokeWidth = .9
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < 5; i++) {
      final shift = i * shortest * .067;
      final upper = Path()
        ..moveTo(w * 1.09, h * .055 + shift)
        ..lineTo(w * .91 - shift * .35, h * .13 + shift)
        ..lineTo(w * .81 - shift * .35, h * .13 + shift);
      canvas.drawPath(upper, i.isEven ? cool : warm);

      final lower = Path()
        ..moveTo(-w * .12, h * .78 - shift)
        ..lineTo(w * .10 + shift * .28, h * .73 - shift)
        ..lineTo(w * .16 + shift * .28, h * .73 - shift);
      canvas.drawPath(lower, i.isOdd ? cool : warm);
    }

    // A few translucent hexagons echo game-slot outlines. Most are clipped
    // at the edge; on narrow phones they never compete with tile subtitles.
    final hexPaint = Paint()
      ..color = const Color(0xFF78B8DB).withValues(alpha: .105)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final warmHex = Paint()
      ..color = const Color(0xFFFFD56C).withValues(alpha: .065)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (var i = 0; i < 7; i++) {
      final radius = shortest * (i.isEven ? .061 : .04);
      final y = h * (.12 + i * .115);
      _hexagon(canvas, Offset(w * (i.isEven ? .98 : -.015), y),
          radius, i.isEven ? hexPaint : warmHex);
    }

    // Discrete stars/sparks: deterministic positions and very low opacity.
    final sparkle = Paint()..style = PaintingStyle.fill;
    for (var i = 0; i < 45; i++) {
      final x = ((i * 47 + 17) % 101) / 101 * w;
      final y = ((i * 83 + 31) % 113) / 113 * h;
      final nearEdge = x < w * .19 || x > w * .81;
      if (!nearEdge && i % 7 != 0) continue;
      sparkle.color = (i % 5 == 0
          ? const Color(0xFFFFD56C)
          : const Color(0xFF79D3F7)).withValues(
              alpha: nearEdge ? .17 : .075);
      canvas.drawCircle(Offset(x, y), i % 6 == 0 ? 1.25 : .75, sparkle);
    }

    // Dark reading corridor over the art. Section headings, form labels
    // and the bottom dock remain on a stable dark surface throughout.
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = ui.Gradient.linear(
          Offset.zero, Offset(w, 0),
          const [
            Color(0x15070B14),
            Color(0xB1070B14),
            Color(0xC0070B14),
            Color(0xB1070B14),
            Color(0x15070B14),
          ],
          const [0, .24, .5, .76, 1],
        ),
    );
    canvas.restore();
  }

  void _glow(Canvas canvas, Offset centre, double radius,
      Color tint, double intensity) {
    final paint = Paint()
      ..shader = ui.Gradient.radial(
        centre, radius,
        [tint.withValues(alpha: intensity),
         tint.withValues(alpha: intensity * .32),
         tint.withValues(alpha: 0)],
        const [0, .42, 1],
      );
    canvas.drawCircle(centre, radius, paint);
  }

  void _radar(Canvas canvas, Offset centre, double baseRadius, Color tint) {
    for (var i = 0; i < 3; i++) {
      final paint = Paint()
        ..color = tint.withValues(alpha: .12 - .025 * i)
        ..style = PaintingStyle.stroke
        ..strokeWidth = i == 0 ? 1.25 : .75;
      canvas.drawArc(
        Rect.fromCircle(center: centre,
          radius: baseRadius * (1 + i * .23)),
        math.pi * .43, math.pi * 1.05, false, paint,
      );
    }
  }

  void _hexagon(Canvas canvas, Offset centre, double radius, Paint paint) {
    final path = Path();
    for (var corner = 0; corner < 6; corner++) {
      final angle = corner * math.pi / 3 - math.pi / 6;
      final point = Offset(centre.dx + radius * math.cos(angle),
          centre.dy + radius * math.sin(angle));
      if (corner == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    canvas.drawPath(path..close(), paint);
  }

  @override
  bool shouldRepaint(covariant ArcadeBackdropPainter oldDelegate) => false;
}
