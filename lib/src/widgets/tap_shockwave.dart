import 'dart:math' as math;
import 'package:flutter/material.dart';

/// One lightweight shockwave is rendered by the game's existing Ticker.
/// It is strictly decorative and is always wrapped in IgnorePointer.
class TapShockwavePainter extends CustomPainter {
  const TapShockwavePainter({
    required this.position,
    required this.progress,
    required this.strength,
  });

  final Offset position;
  final double progress;
  final double strength;

  @override
  void paint(Canvas canvas, Size size) {
    final t = progress.clamp(0.0, 1.0);
    final fade = math.pow(1 - t, 1.6).toDouble();
    if (fade <= 0.005) return;

    final energy = strength.clamp(0.0, 1.0);
    final radius = 12 + (38 + energy * 34) * t;
    final outer = Paint()
      ..color = const Color(0xFFFFD56C).withValues(alpha: fade * 0.88)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.5 * (1 - t) + 0.8;
    final inner = Paint()
      ..color = const Color(0xFF46D7FF).withValues(alpha: fade * 0.72)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0 * (1 - t) + 0.6;

    canvas.drawCircle(position, radius, outer);
    canvas.drawCircle(position, radius * 0.66, inner);
    canvas.drawCircle(position, 5.5 * (1 - t), Paint()
      ..color = Colors.white.withValues(alpha: fade * .85));

    // Deterministic rays mean no allocation-heavy random work every frame.
    final rayCount = 6 + (energy * 6).round();
    for (var i = 0; i < rayCount; i++) {
      final angle = math.pi * 2 * i / rayCount;
      final direction = Offset(math.cos(angle), math.sin(angle));
      final from = position + direction * (radius + 4);
      final to = position + direction * (radius + 9 + 10 * energy);
      final paint = Paint()
        ..color = (i.isEven ? const Color(0xFFFFE277) : const Color(0xFFBD6BFF))
            .withValues(alpha: fade * .74)
        ..strokeWidth = 2.0
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(from, to, paint);
    }
  }

  @override
  bool shouldRepaint(covariant TapShockwavePainter oldDelegate) =>
      position != oldDelegate.position ||
      progress != oldDelegate.progress ||
      strength != oldDelegate.strength;
}
