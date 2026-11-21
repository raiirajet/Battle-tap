import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'rules.dart';
import 'skins.dart';

/// Practice-only storage. Never used as the source for global rankings.
class PracticeStore extends ChangeNotifier {
  PracticeStore(this._prefs) {
    rankedBest = _prefs.getInt('practice_ranked_best_v2') ?? 0;
    huntBest = _prefs.getInt('practice_hunt_best') ?? 0;
    gamesPlayed = _prefs.getInt('practice_games') ?? 0;
    totalHits = _prefs.getInt('practice_hits') ?? 0;
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
  late int rankedBest;
  late int huntBest;
  late int gamesPlayed;
  late int totalHits;
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

  bool savePracticeRound(RoundScore result) {
    final wasBest = result.mode == BattleMode.ranked
        ? result.score > rankedBest
        : result.score > huntBest;
    if (result.mode == BattleMode.ranked && wasBest) rankedBest = result.score;
    if (result.mode == BattleMode.hunt && wasBest) huntBest = result.score;
    gamesPlayed++;
    totalHits += result.hits;
    _prefs.setInt('practice_ranked_best_v2', rankedBest);
    _prefs.setInt('practice_hunt_best', huntBest);
    _prefs.setInt('practice_games', gamesPlayed);
    _prefs.setInt('practice_hits', totalHits);
    notifyListeners();
    return wasBest;
  }

  void equip(String id) {
    if (id != 'standard') return; // Paid skins require verified ownership.
    equippedSkinId = id;
    _prefs.setString('equipped_skin', id);
    notifyListeners();
  }

  BattleSkin get equipped => skinById(equippedSkinId);
}
