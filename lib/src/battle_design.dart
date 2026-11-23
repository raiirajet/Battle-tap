import 'package:flutter/material.dart';

/// A single, reusable visual language for all Battle Tap screens.
/// No images, network dependencies or continuously ticking animations.
abstract final class BattleColors {
  static const background = Color(0xFF070B14);
  static const elevated = Color(0xFF0D1422);
  static const panel = Color(0xFF131D2E);
  static const panelBright = Color(0xFF1C2A40);
  static const border = Color(0xFF293C56);
  static const gold = Color(0xFFFFD56C);
  static const cyan = Color(0xFF53C5FF);
  static const green = Color(0xFF39D98A);
  static const red = Color(0xFFFF5C75);
  static const primaryText = Color(0xFFF4F7FB);
  static const mutedText = Color(0xFFAAB6C8);
}

abstract final class BattleDesign {
  static ThemeData get theme {
    final scheme = ColorScheme.fromSeed(
      seedColor: BattleColors.gold,
      brightness: Brightness.dark,
    ).copyWith(
      primary: BattleColors.gold,
      onPrimary: BattleColors.background,
      secondary: BattleColors.cyan,
      onSecondary: BattleColors.background,
      surface: BattleColors.panel,
      onSurface: BattleColors.primaryText,
      error: BattleColors.red,
    );
    final rounded = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(18),
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: Colors.transparent,
      canvasColor: BattleColors.elevated,
      colorScheme: scheme,
      dividerColor: BattleColors.border,
      splashColor: BattleColors.gold.withValues(alpha: .09),
      highlightColor: BattleColors.cyan.withValues(alpha: .06),
      cardTheme: CardThemeData(
        color: BattleColors.panel,
        elevation: 0,
        margin: const EdgeInsets.symmetric(vertical: 5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: BattleColors.border, width: .8),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: BattleColors.primaryText,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        elevation: 0,
        titleTextStyle: TextStyle(
          color: BattleColors.primaryText,
          fontSize: 18,
          letterSpacing: 1.15,
          fontWeight: FontWeight.w900,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: BattleColors.gold,
          foregroundColor: BattleColors.background,
          disabledBackgroundColor: BattleColors.panelBright,
          disabledForegroundColor: BattleColors.mutedText,
          minimumSize: const Size(148, 52),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
          elevation: 0,
          textStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: .7),
          shape: rounded,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: BattleColors.primaryText,
          side: const BorderSide(color: BattleColors.border, width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
          minimumSize: const Size(96, 48),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
          shape: rounded,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: BattleColors.gold,
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(foregroundColor: BattleColors.gold),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: BattleColors.elevated,
        labelStyle: const TextStyle(color: BattleColors.mutedText),
        hintStyle: const TextStyle(color: BattleColors.mutedText),
        prefixIconColor: BattleColors.cyan,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: BattleColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: BattleColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: BattleColors.gold, width: 1.6),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: BattleColors.cyan,
        textColor: BattleColors.primaryText,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: BattleColors.panelBright,
        contentTextStyle: const TextStyle(color: BattleColors.primaryText),
        behavior: SnackBarBehavior.floating,
        shape: rounded,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: BattleColors.elevated,
        modalBackgroundColor: BattleColors.elevated,
        showDragHandle: true,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: BattleColors.panel,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: BattleColors.gold,
      ),
      sliderTheme: const SliderThemeData(
        activeTrackColor: BattleColors.gold,
        thumbColor: BattleColors.gold,
        inactiveTrackColor: BattleColors.border,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? BattleColors.gold : BattleColors.mutedText,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: BattleColors.elevated,
        selectedColor: BattleColors.gold.withValues(alpha: .22),
        labelStyle: const TextStyle(
          color: BattleColors.primaryText,
          fontWeight: FontWeight.w800,
        ),
        side: const BorderSide(color: BattleColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? BattleColors.gold : BattleColors.mutedText,
          ),
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? BattleColors.gold.withValues(alpha: .15)
                : BattleColors.elevated,
          ),
          side: WidgetStateProperty.all(
            const BorderSide(color: BattleColors.border),
          ),
        ),
      ),
    );
  }
}

/// Static layered ambient light. Avoids particle loops / GPU-heavy blur.
/// Applied outside every Scaffold, including routes and login.
class BattleBackdrop extends StatelessWidget {
  const BattleBackdrop({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF080F1E),
              BattleColors.background,
              Color(0xFF080E19),
              Color(0xFF0B1020),
            ],
            stops: [0, .35, .7, 1],
          ),
        ),
      ),
      const IgnorePointer(child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(.92, -.92),
            radius: 1.12,
            colors: [Color(0x373675C9), Color(0x083675C9), Colors.transparent],
            stops: [0, .48, 1],
          ),
        ),
      )),
      const IgnorePointer(child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-1.1, .85),
            radius: 1.4,
            colors: [Color(0x214DADAE), Colors.transparent],
          ),
        ),
      )),
      child,
    ],
  );
}

/// Surface used for achievements, account settings, scorecards and game tiles.
class BattleSurface extends StatelessWidget {
  const BattleSurface({
    super.key,
    required this.child,
    this.accent = BattleColors.cyan,
    this.padding = const EdgeInsets.all(16),
    this.radius = 20,
  });

  final Widget child;
  final Color accent;
  final EdgeInsetsGeometry padding;
  final double radius;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(radius),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color.lerp(BattleColors.panel, accent, .075)!,
          BattleColors.elevated,
        ],
      ),
      border: Border.all(color: Color.lerp(BattleColors.border, accent, .18)!),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: .15),
          blurRadius: 20,
          offset: const Offset(0, 9),
        ),
      ],
    ),
    child: Padding(padding: padding, child: child),
  );
}

/// One consistent header style for PLAY subsections, SHOP, RANKS and FRIENDS.
class BattleSectionTitle extends StatelessWidget {
  const BattleSectionTitle({
    super.key, required this.title, required this.subtitle, this.icon,
  });
  final String title;
  final String subtitle;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        if (icon != null) ...[
          Icon(icon, color: BattleColors.gold, size: 19),
          const SizedBox(width: 9),
        ],
        Expanded(child: Text(title, style: const TextStyle(
          fontSize: 17, fontWeight: FontWeight.w900,
          color: BattleColors.primaryText, letterSpacing: 1.15,
        ))),
      ]),
      const SizedBox(height: 4),
      Text(subtitle, style: const TextStyle(
        fontSize: 12, color: BattleColors.mutedText,
      )),
    ]),
  );
}

class BattlePageHeader extends StatelessWidget {
  const BattlePageHeader({
    super.key, required this.title, required this.subtitle,
    required this.icon,
  });
  final String title;
  final String subtitle;
  final Widget icon;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
    child: BattleSurface(
      accent: BattleColors.gold,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 17),
      child: Row(children: [
        Container(
          width: 58, height: 58,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: BattleColors.gold.withValues(alpha: .085),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: BattleColors.gold.withValues(alpha: .20)),
          ),
          child: icon,
        ),
        const SizedBox(width: 16),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(
              fontSize: 23, fontWeight: FontWeight.w900, letterSpacing: .75,
              color: BattleColors.primaryText,
            )),
            const SizedBox(height: 5),
            Text(subtitle, style: const TextStyle(
              color: BattleColors.mutedText, fontSize: 11,
            )),
          ],
        )),
      ]),
    ),
  );
}

class BattleMetric extends StatelessWidget {
  const BattleMetric({super.key, required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => BattleSurface(
    accent: BattleColors.gold,
    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 15),
    child: Column(children: [
      Text(label, maxLines: 2, textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 10, color: BattleColors.mutedText,
          fontWeight: FontWeight.w800, letterSpacing: 1,
        )),
      const SizedBox(height: 6),
      FittedBox(fit: BoxFit.scaleDown,
        child: Text(value, style: const TextStyle(
          fontSize: 27, fontWeight: FontWeight.w900,
          color: BattleColors.gold,
        ))),
    ]),
  );
}

/// Dedicated, tactile game-mode card; preserves existing onTap behavior.
class BattleModeTile extends StatefulWidget {
  const BattleModeTile({
    super.key, required this.title, required this.subtitle,
    required this.detail, required this.icon, required this.accent,
    required this.onTap, this.reduceMotion = false,
  });

  final String title;
  final String subtitle;
  final String detail;
  final IconData icon;
  final Color accent;
  final VoidCallback onTap;
  final bool reduceMotion;

  @override
  State<BattleModeTile> createState() => _BattleModeTileState();
}

class _BattleModeTileState extends State<BattleModeTile> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final noAnimation = widget.reduceMotion ||
        MediaQuery.maybeOf(context)?.disableAnimations == true;
    return AnimatedScale(
      scale: noAnimation || !_pressed ? 1 : .985,
      duration: noAnimation ? Duration.zero : const Duration(milliseconds: 110),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(23),
          onTapDown: (_) => setState(() => _pressed = true),
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          child: BattleSurface(
            accent: widget.accent,
            radius: 23,
            padding: const EdgeInsets.fromLTRB(15, 16, 13, 16),
            child: Row(children: [
              Container(
                width: 64, height: 70,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      widget.accent.withValues(alpha: .26),
                      widget.accent.withValues(alpha: .045),
                    ],
                  ),
                  border: Border.all(color: widget.accent.withValues(alpha: .32)),
                ),
                child: Icon(widget.icon, size: 33, color: widget.accent),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title, style: const TextStyle(
                    fontWeight: FontWeight.w900, fontSize: 17,
                    color: BattleColors.primaryText, letterSpacing: .35,
                  )),
                  const SizedBox(height: 5),
                  Text(widget.subtitle, style: const TextStyle(
                    color: BattleColors.mutedText, fontSize: 10.5,
                    height: 1.35,
                  )),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                    decoration: BoxDecoration(
                      color: widget.accent.withValues(alpha: .11),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Text(widget.detail, style: TextStyle(
                      color: widget.accent, fontSize: 9.5,
                      fontWeight: FontWeight.w900, letterSpacing: .1,
                    )),
                  ),
                ],
              )),
              const SizedBox(width: 7),
              Icon(Icons.chevron_right_rounded, color: widget.accent, size: 23),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Reusable static arena floor: gradient, subtle grid, and glowing border.
class BattleArena extends StatelessWidget {
  const BattleArena({super.key, this.accent = BattleColors.cyan, this.danger = false});
  final Color accent;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final glow = danger ? BattleColors.red : accent;
    return IgnorePointer(child: ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: danger
                ? const [Color(0xFF301824), Color(0xFF130F1B)]
                : const [Color(0xFF13233B), Color(0xFF0C1424), Color(0xFF101D30)],
          ),
          border: Border.all(color: glow.withValues(alpha: .52), width: 1.2),
          boxShadow: [BoxShadow(
            color: glow.withValues(alpha: .11), blurRadius: 25,
          )],
        ),
        child: CustomPaint(painter: const _ArenaGridPainter()),
      ),
    ));
  }
}

class _ArenaGridPainter extends CustomPainter {
  const _ArenaGridPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x1177AEDD)
      ..strokeWidth = .6;
    for (var x = 0.0; x < size.width; x += 28) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += 28) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class BattleDockItem {
  const BattleDockItem(this.label, this.icon);
  final String label;
  final Widget icon;
}

/// Compact custom dock, works across all screen widths without overlaying PLAY.
class BattleDock extends StatelessWidget {
  const BattleDock({
    super.key, required this.selectedIndex, required this.items,
    required this.onSelected, this.reduceMotion = false,
  });
  final int selectedIndex;
  final List<BattleDockItem> items;
  final ValueChanged<int> onSelected;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context) {
    final noAnimation = reduceMotion ||
        MediaQuery.maybeOf(context)?.disableAnimations == true;
    return SafeArea(
      top: false,
      minimum: const EdgeInsets.only(bottom: 5),
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 3),
        decoration: BoxDecoration(
          color: BattleColors.elevated.withValues(alpha: .97),
          border: const Border(top: BorderSide(color: BattleColors.border)),
          boxShadow: const [
            BoxShadow(color: Color(0x66000000), blurRadius: 22,
              offset: Offset(0, -7)),
          ],
        ),
        child: Row(
          children: List.generate(items.length, (i) {
            final active = selectedIndex == i;
            final item = items[i];
            return Expanded(child: Semantics(
              selected: active,
              button: true,
              label: item.label,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Material(color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(17),
                    onTap: () => onSelected(i),
                    child: AnimatedContainer(
                      duration: noAnimation ? Duration.zero :
                          const Duration(milliseconds: 170),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(17),
                        color: active ? BattleColors.gold.withValues(alpha: .12) :
                            Colors.transparent,
                        border: Border.all(color: active
                            ? BattleColors.gold.withValues(alpha: .35) :
                            Colors.transparent),
                      ),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        SizedBox(height: 24, child: IconTheme(
                          data: IconThemeData(
                            size: 24,
                            color: active ? BattleColors.gold : BattleColors.mutedText,
                          ),
                          child: Center(child: item.icon),
                        )),
                        const SizedBox(height: 5),
                        Text(item.label, maxLines: 1,
                          style: TextStyle(
                            fontSize: 9.5, letterSpacing: .3,
                            fontWeight: active ? FontWeight.w900 : FontWeight.w700,
                            color: active ? BattleColors.gold : BattleColors.mutedText,
                          )),
                      ]),
                    ),
                  ),
                ),
              ),
            ));
          }),
        ),
      ),
    );
  }
}
