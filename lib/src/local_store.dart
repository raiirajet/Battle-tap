import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'rules.dart';
import 'arcade_rules.dart';
import 'skins.dart';

/// Practice-only storage. Never used as the source for global rankings.
class PracticeStore extends ChangeNotifier {
  PracticeStore(this._prefs) {
    rankedBest = _prefs.getInt('practice_ranked_best_v2') ?? 0;
    huntBest = _prefs.getInt('practice_hunt_best') ?? 0;
    for (final mode in ArcadeMode.values) {
      final value = _prefs.getInt('arcade_${mode.name}_best_v1');
      if (value != null) _arcadeBests[mode] = value;
    }
    gamesPlayed = _prefs.getInt('practice_games') ?? 0;
    totalHits = _prefs.getInt('practice_hits') ?? 0;
    // Legacy versions stored only successful practice taps. Keep them as a
    // baseline; count all new distinct touches (hits and misses) from now on.
    totalTaps = _prefs.getInt('lifetime_total_taps') ?? totalHits;
    rankedRounds = _prefs.getInt('stats_ranked_rounds') ?? 0;
    huntRounds = _prefs.getInt('stats_hunt_rounds') ?? 0;
    rankedCompletedHits = _prefs.getInt('stats_ranked_hits') ?? 0;
    huntCompletedHits = _prefs.getInt('stats_hunt_hits') ?? 0;
    rankedCompletedMs = _prefs.getInt('stats_ranked_ms') ?? 0;
    huntCompletedMs = _prefs.getInt('stats_hunt_ms') ?? 0;
    equippedSkinId = _prefs.getString('equipped_skin') ?? 'standard';
    soundEnabled = _prefs.getBool('sound_enabled') ?? true;
    vibrationEnabled = _prefs.getBool('vibration_enabled') ?? true;
    reducedEffects = _prefs.getBool('reduced_effects') ?? false;
    adaptiveAudioEnabled = _prefs.getBool('adaptive_audio_enabled') ?? true;
    soundVolume = (_prefs.getDouble('sound_volume') ?? 0.85).clamp(0.0, 1.0).toDouble();
    notificationsEnabled = _prefs.getBool('notifications_enabled') ?? false;
    startupChoicesSeen = _prefs.getBool('startup_choices_seen') ?? false;
  }
  final SharedPreferences _prefs;
  final Map<ArcadeMode, int> _arcadeBests = {};
  int? arcadeBest(ArcadeMode mode) => _arcadeBests[mode];
  late int rankedBest;
  late int huntBest;
  late int gamesPlayed;
  late int totalHits;
  late int totalTaps;
  late int rankedRounds;
  late int huntRounds;
  late int rankedCompletedHits;
  late int huntCompletedHits;
  late int rankedCompletedMs;
  late int huntCompletedMs;
  Timer? _tapWriteTimer;

  /// Average accepted hits per second, weighted by completed round duration.
  double get rankedAverageSpeed => rankedCompletedMs == 0 ? 0 :
      rankedCompletedHits * 1000 / rankedCompletedMs;
  double get huntAverageSpeed => huntCompletedMs == 0 ? 0 :
      huntCompletedHits * 1000 / huntCompletedMs;

  late String equippedSkinId;
  late bool soundEnabled;
  late bool vibrationEnabled;
  late bool reducedEffects;
  late bool adaptiveAudioEnabled;
  late double soundVolume;
  late bool notificationsEnabled;
  late bool startupChoicesSeen;

  void setSound(bool value) { soundEnabled = value; _prefs.setBool('sound_enabled', value); notifyListeners(); }
  void setVibration(bool value) { vibrationEnabled = value; _prefs.setBool('vibration_enabled', value); notifyListeners(); }
  void setReducedEffects(bool value) { reducedEffects = value; _prefs.setBool('reduced_effects', value); notifyListeners(); }

  void setAdaptiveAudio(bool value) {
    adaptiveAudioEnabled = value;
    _prefs.setBool('adaptive_audio_enabled', value);
    notifyListeners();
  }

  void setSoundVolume(double value) {
    soundVolume = value.clamp(0.0, 1.0);
    _prefs.setDouble('sound_volume', soundVolume);
    notifyListeners();
  }

  void setNotifications(bool value) {
    notificationsEnabled = value;
    _prefs.setBool('notifications_enabled', value);
    notifyListeners();
  }

  void setStartupChoicesSeen() {
    startupChoicesSeen = true;
    _prefs.setBool('startup_choices_seen', true);
    notifyListeners();
  }

  /// Lightweight counter: don't write SharedPreferences on every rapid tap.
  void registerTap() {
    totalTaps++;
    _tapWriteTimer ??= Timer(const Duration(milliseconds: 650), flushTapCount);
  }

  void flushTapCount() {
    _tapWriteTimer?.cancel();
    _tapWriteTimer = null;
    _prefs.setInt('lifetime_total_taps', totalTaps);
  }

  void _recordCompletedRound(RoundScore result) {
    gamesPlayed++;
    if (result.mode == BattleMode.ranked) {
      rankedRounds++;
      rankedCompletedHits += result.hits;
      rankedCompletedMs += result.duration.inMilliseconds;
      _prefs.setInt('stats_ranked_rounds', rankedRounds);
      _prefs.setInt('stats_ranked_hits', rankedCompletedHits);
      _prefs.setInt('stats_ranked_ms', rankedCompletedMs);
    } else {
      huntRounds++;
      huntCompletedHits += result.hits;
      huntCompletedMs += result.duration.inMilliseconds;
      _prefs.setInt('stats_hunt_rounds', huntRounds);
      _prefs.setInt('stats_hunt_hits', huntCompletedHits);
      _prefs.setInt('stats_hunt_ms', huntCompletedMs);
    }
    flushTapCount();
    _prefs.setInt('practice_games', gamesPlayed);
    notifyListeners();
  }

  bool savePracticeRound(RoundScore result) {
    final wasBest = result.mode == BattleMode.ranked
        ? result.score > rankedBest
        : result.score > huntBest;
    if (result.mode == BattleMode.ranked && wasBest) rankedBest = result.score;
    if (result.mode == BattleMode.hunt && wasBest) huntBest = result.score;
    totalHits += result.hits;
    _prefs.setInt('practice_ranked_best_v2', rankedBest);
    _prefs.setInt('practice_hunt_best', huntBest);
    _prefs.setInt('practice_hits', totalHits);
    _recordCompletedRound(result);
    return wasBest;
  }

  /// Independent, device-only arcade records. No Firebase ranked stats are touched.
  bool saveArcadeRound({required ArcadeMode mode, required int score, required int hits}) {
    final previous = _arcadeBests[mode];
    final newBest = previous == null || (mode.lowerIsBetter
        ? score < previous : score > previous);
    if (newBest) {
      _arcadeBests[mode] = score;
      _prefs.setInt('arcade_${mode.name}_best_v1', score);
    }
    gamesPlayed++;
    totalHits += hits;
    flushTapCount();
    _prefs.setInt('practice_games', gamesPlayed);
    _prefs.setInt('practice_hits', totalHits);
    notifyListeners();
    return newBest;
  }

  /// Online ranked rounds count only after verified server acceptance.
  void saveVerifiedRound(RoundScore result) => _recordCompletedRound(result);

  void equip(String id) {
    final skin = skinById(id);
    if (!skin.isFree) return; // Paid skins require verified purchase ownership.
    if (equippedSkinId == id) return;
    equippedSkinId = skin.id;
    _prefs.setString('equipped_skin', id);
    notifyListeners();
  }

  @override
  void dispose() {
    flushTapCount();
    super.dispose();
  }

  BattleSkin get equipped => skinById(equippedSkinId);
}
