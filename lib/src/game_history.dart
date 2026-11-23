import 'dart:convert';

/// Local-only activity feed. No history entries are uploaded to Firebase.
abstract final class GameHistoryCatalog {
  static const keys = <String>[
    'ranked', 'hunt', 'bubbleRush', 'colorTrap',
    'reflexGo', 'memoryMatrix', 'timingStrike', 'duel',
  ];

  static String title(String mode) => switch (mode) {
    'ranked' => 'TAP BATTLE',
    'hunt' => 'RANDOM HUNT',
    'bubbleRush' => 'BUBBLE RUSH',
    'colorTrap' => 'COLOR TRAP',
    'reflexGo' => 'REFLEX GO',
    'memoryMatrix' => 'MEMORY MATRIX',
    'timingStrike' => 'TIMING STRIKE',
    'duel' => '1 GEGEN 1 ARCADE',
    _ => mode,
  };

  static String format(String mode, int score) => '$score Punkte';
}

/// One completed game or one completed turn of a local two-player duel.
/// App versions before history support retain their previous saved bests;
/// only games completed since this update have chronological entries.
class GameHistoryEntry {
  const GameHistoryEntry({
    required this.mode,
    required this.score,
    required this.hits,
    required this.when,
    this.verified = false,
    this.player,
    this.level,
  });

  final String mode;
  final int score;
  final int hits;
  final DateTime when;
  final bool verified;
  final String? player;
  final int? level;

  Map<String, dynamic> toJson() => {
    'mode': mode,
    'score': score,
    'hits': hits,
    'at': when.toUtc().toIso8601String(),
    'verified': verified,
    if (player != null) 'player': player,
    if (level != null) 'level': level,
  };

  static GameHistoryEntry? fromJson(dynamic value) {
    if (value is! Map) return null;
    try {
      final mode = value['mode'];
      final score = value['score'];
      final hits = value['hits'];
      final at = value['at'];
      if (mode is! String || !GameHistoryCatalog.keys.contains(mode) ||
          score is! int || hits is! int || hits < 0 || at is! String) {
        return null;
      }
      final parsed = DateTime.tryParse(at);
      if (parsed == null) return null;
      final player = value['player'];
      final level = value['level'];
      return GameHistoryEntry(
        mode: mode,
        score: score,
        hits: hits,
        when: parsed.toLocal(),
        verified: value['verified'] == true,
        player: player is String && player.trim().isNotEmpty ? player : null,
        level: level is int && level > 0 ? level : null,
      );
    } catch (_) {
      return null;
    }
  }

  static List<GameHistoryEntry> decode(String? json) {
    if (json == null || json.isEmpty) return [];
    try {
      final data = jsonDecode(json);
      if (data is! List) return [];
      return data.map(fromJson).whereType<GameHistoryEntry>().toList();
    } catch (_) {
      return [];
    }
  }

  static String encode(List<GameHistoryEntry> history) =>
      jsonEncode(history.map((item) => item.toJson()).toList());
}
