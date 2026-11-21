import 'package:flutter/material.dart';

/// BattleTap's original neon artwork, optimized for small app bundles.
/// Artwork is bundled locally and remains visible without an internet connection.
class BattleTapLogo extends StatelessWidget {
  const BattleTapLogo({super.key, this.height = 136});
  final double height;

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'BattleTap Logo',
    image: true,
    child: Image.asset(
      'assets/branding/battle_tap_logo.webp',
      height: height,
      width: double.infinity,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, __, ___) => SizedBox(
        height: height,
        child: const Center(child: Text('BATTLE TAP',
          style: TextStyle(color: Color(0xFFFFD56C),
            fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 2))),
      ),
    ),
  );
}

class BattleTapBadge extends StatelessWidget {
  const BattleTapBadge({super.key, this.size = 48});
  final double size;

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'BattleTap Champion-Emblem',
    image: true,
    child: Image.asset(
      'assets/branding/bt_badge.webp',
      width: size,
      height: size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, __, ___) => Icon(
        Icons.emoji_events_rounded, color: const Color(0xFFFFD56C), size: size),
    ),
  );
}

class BattleTapAppMark extends StatelessWidget {
  const BattleTapAppMark({super.key, this.size = 32});
  final double size;

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'BattleTap App-Icon',
    image: true,
    child: Image.asset(
      'assets/branding/app_icon.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, __, ___) => Icon(
        Icons.ads_click_rounded, color: const Color(0xFFFFD56C), size: size),
    ),
  );
}
