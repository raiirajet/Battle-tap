import 'package:battle_tap/src/battle_design.dart';
import 'package:battle_tap/src/widgets/arcade_backdrop_art.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

double contrastRatio(Color foreground, Color background) {
  final light = foreground.computeLuminance();
  final dark = background.computeLuminance();
  final higher = light > dark ? light : dark;
  final lower = light > dark ? dark : light;
  return (higher + .05) / (lower + .05);
}

void main() {
  test('body text and gold/cyan accents keep contrast on the brightest navy',
      () {
    const brightestBackdrop = Color(0xFF1A293F);
    expect(contrastRatio(BattleColors.primaryText, brightestBackdrop),
        greaterThan(4.5));
    expect(contrastRatio(BattleColors.mutedText, brightestBackdrop),
        greaterThan(4.5));
    expect(contrastRatio(BattleColors.gold, brightestBackdrop),
        greaterThan(4.5));
    expect(contrastRatio(BattleColors.cyan, brightestBackdrop),
        greaterThan(4.5));
  });

  test('background art is stable and does not ask for constant repaints', () {
    const painter = ArcadeBackdropPainter();
    expect(painter.shouldRepaint(const ArcadeBackdropPainter()), isFalse);
  });

  testWidgets('artwork stays behind UI and never intercepts taps',
      (tester) async {
    var taps = 0;
    await tester.pumpWidget(MaterialApp(
      theme: BattleDesign.theme,
      builder: (context, child) =>
          BattleBackdrop(child: child ?? const SizedBox.shrink()),
      home: Scaffold(body: Center(
        child: FilledButton(
          onPressed: () => taps++,
          child: const Text('SPIELEN'),
        ),
      )),
    ));
    expect(find.byType(ArcadeBackdropArt), findsOneWidget);
    await tester.tap(find.text('SPIELEN'));
    await tester.pump();
    expect(taps, 1);
    expect(tester.takeException(), isNull);
  });
}
