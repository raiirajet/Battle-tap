import 'package:battle_tap/src/battle_design.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('premium design keeps its core color semantics', () {
    expect(BattleDesign.theme.scaffoldBackgroundColor, Colors.transparent);
    expect(BattleDesign.theme.colorScheme.primary, BattleColors.gold);
    expect(BattleDesign.theme.colorScheme.error, BattleColors.red);
  });

  testWidgets('custom dock switches tabs instead of changing game logic',
      (tester) async {
    var selected = 0;
    await tester.pumpWidget(MaterialApp(
      theme: BattleDesign.theme,
      home: StatefulBuilder(builder: (context, setState) => Scaffold(
        body: Center(child: Text('Selected $selected')),
        bottomNavigationBar: BattleDock(
          selectedIndex: selected,
          onSelected: (index) => setState(() => selected = index),
          items: const [
            BattleDockItem('PLAY', Icon(Icons.sports_esports)),
            BattleDockItem('RANKS', Icon(Icons.emoji_events)),
            BattleDockItem('SHOP', Icon(Icons.storefront)),
            BattleDockItem('FRIENDS', Icon(Icons.people)),
            BattleDockItem('PROFILE', Icon(Icons.person)),
          ],
        ),
      )),
    ));
    expect(find.text('Selected 0'), findsOneWidget);
    await tester.tap(find.text('SHOP'));
    await tester.pumpAndSettle();
    expect(find.text('Selected 2'), findsOneWidget);
    expect(find.text('PLAY'), findsOneWidget);
    expect(find.text('FRIENDS'), findsOneWidget);
  });

  testWidgets('mode tile still invokes the original play action', (tester) async {
    var launches = 0;
    await tester.pumpWidget(MaterialApp(
      theme: BattleDesign.theme,
      home: Scaffold(body: Center(child: BattleModeTile(
        title: 'BUBBLE RUSH',
        subtitle: 'Blasen platzen lassen',
        detail: 'SKILL ARCADE',
        icon: Icons.bubble_chart,
        accent: BattleColors.cyan,
        onTap: () => launches++,
        reduceMotion: true,
      ))),
    ));
    await tester.tap(find.text('BUBBLE RUSH'));
    await tester.pumpAndSettle();
    expect(launches, 1);
  });
}
