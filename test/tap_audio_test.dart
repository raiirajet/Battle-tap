import 'package:flutter_test/flutter_test.dart';
import 'package:battle_tap/src/battle_audio.dart';

void main() {
  test('silent adaptive mode retains constant tap sound', () {
    expect(tapSoundTier(hits: 200, combo: 40, hitsPerSecond: 15, adaptive: false), 0);
  });
  test('sound tier rises with hits', () {
    expect(tapSoundTier(hits: 1, combo: 1, hitsPerSecond: 1, adaptive: true), 0);
    expect(tapSoundTier(hits: 24, combo: 1, hitsPerSecond: 1, adaptive: true), 2);
  });
  test('combo and speed independently increase the pitch tier', () {
    expect(tapSoundTier(hits: 1, combo: 28, hitsPerSecond: 2, adaptive: true), 4);
    expect(tapSoundTier(hits: 1, combo: 1, hitsPerSecond: 8.6, adaptive: true), 5);
  });
  test('tier is capped at the top playable sample', () {
    expect(tapSoundTier(hits: 400, combo: 200, hitsPerSecond: 50, adaptive: true), 7);
  });
}
