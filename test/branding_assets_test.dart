import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Bundled BattleTap branding assets are present and nonempty', () async {
    const images = [
      'assets/branding/app_icon.png',
      'assets/branding/battle_tap_logo.webp',
      'assets/branding/bt_badge.webp',
    ];
    for (final path in images) {
      final bytes = await rootBundle.load(path);
      expect(bytes.lengthInBytes, greaterThan(1000), reason: path);
    }
  });
}
