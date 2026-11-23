import 'package:flutter/material.dart';

import 'battle_design.dart';
import 'game_history.dart';
import 'local_store.dart';

/// One local hub for personal records and every completed game.
class GameHistoryPage extends StatefulWidget {
  const GameHistoryPage({super.key, required this.store});
  final PracticeStore store;

  @override
  State<GameHistoryPage> createState() => _GameHistoryPageState();
}

class _GameHistoryPageState extends State<GameHistoryPage> {
  int _view = 0;
  String? _filter;

  static const _modeIcons = <String, IconData>{
    'ranked': Icons.ads_click_rounded,
    'hunt': Icons.control_camera_rounded,
    'bubbleRush': Icons.bubble_chart_rounded,
    'colorTrap': Icons.traffic_rounded,
    'reflexGo': Icons.bolt_rounded,
    'memoryMatrix': Icons.grid_view_rounded,
    'timingStrike': Icons.track_changes_rounded,
    'duel': Icons.people_alt_rounded,
  };

  static const _modeColors = <String, Color>{
    'ranked': BattleColors.gold,
    'hunt': BattleColors.cyan,
    'bubbleRush': Color(0xFF5BD9F6),
    'colorTrap': BattleColors.green,
    'reflexGo': Color(0xFFFFA9B5),
    'memoryMatrix': Color(0xFFB6A1FF),
    'timingStrike': Color(0xFFFFBF80),
    'duel': Color(0xFFFF88A6),
  };

  String _date(DateTime value) {
    final date = value.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(date.day)}.${two(date.month)}.${date.year} · '
        '${two(date.hour)}:${two(date.minute)}';
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('MEINE SPIELE')),
    body: SafeArea(child: AnimatedBuilder(
      animation: widget.store,
      builder: (context, _) {
        final all = widget.store.history;
        final filtered = _filter == null
            ? all : all.where((entry) => entry.mode == _filter).toList();
        return Column(children: [
          const BattlePageHeader(
            title: 'DEINE REKORDE',
            subtitle: 'Persönliche Bestwerte & Spielverlauf • nur auf diesem Gerät',
            icon: Icon(Icons.emoji_events_rounded,
              size: 34, color: BattleColors.gold),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(children: [
              Expanded(child: BattleMetric(
                label: 'GESPIELTE RUNDEN', value: '${widget.store.gamesPlayed}')),
              const SizedBox(width: 12),
              Expanded(child: BattleMetric(
                label: 'VERLAUFEINTRÄGE', value: '${all.length}')),
            ]),
          ),
          const SizedBox(height: 16),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0,
                icon: Icon(Icons.emoji_events_outlined),
                label: Text('BESTENLISTE')),
              ButtonSegment(value: 1,
                icon: Icon(Icons.history_rounded),
                label: Text('VERLAUF')),
            ],
            selected: {_view},
            onSelectionChanged: (selection) =>
                setState(() => _view = selection.first),
          ),
          const SizedBox(height: 12),
          if (_view == 1) ...[
            SizedBox(height: 43, child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 15),
              children: [
                _filterChip(null, 'ALLE'),
                for (final key in GameHistoryCatalog.keys)
                  _filterChip(key, GameHistoryCatalog.title(key)),
              ],
            )),
            const SizedBox(height: 8),
          ],
          Expanded(child: _view == 0
              ? _bests()
              : filtered.isEmpty
                  ? const Center(child: Padding(
                      padding: EdgeInsets.all(26),
                      child: Text(
                        'Noch kein abgeschlossener Spielverlauf vorhanden. '
                        'Neue Runden werden ab dieser Version gespeichert.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: BattleColors.mutedText),
                      ),
                    ))
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 2, 16, 22),
                      itemCount: filtered.length,
                      itemBuilder: (context, i) => _historyTile(filtered[i]),
                    )),
        ]);
      },
    )),
  );

  Widget _filterChip(String? key, String label) => Padding(
    padding: const EdgeInsets.only(right: 7),
    child: ChoiceChip(
      label: Text(label),
      selected: _filter == key,
      onSelected: (_) => setState(() => _filter = key),
    ),
  );

  Widget _bests() => ListView(
    padding: const EdgeInsets.fromLTRB(16, 2, 16, 22),
    children: [
      const Padding(
        padding: EdgeInsets.fromLTRB(3, 2, 3, 16),
        child: Text(
          'Deine besten Ergebnisse je Spielmodus. Ältere gespeicherte '
          'Bestwerte bleiben sichtbar, auch wenn der Verlauf erst jetzt beginnt.',
          style: TextStyle(color: BattleColors.mutedText, fontSize: 12),
        ),
      ),
      for (final key in GameHistoryCatalog.keys) _bestTile(key),
    ],
  );

  Widget _bestTile(String key) {
    final score = widget.store.bestForGame(key);
    final entries = widget.store.history.where((entry) => entry.mode == key).length;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: BattleSurface(
        accent: _modeColors[key] ?? BattleColors.gold,
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
        child: Row(children: [
          _modeIcon(key),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(GameHistoryCatalog.title(key),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Text(key == 'memoryMatrix'
                  ? 'Beste Stufe: ${widget.store.memoryBestLevel} / 20'
                  : '$entries dokumentierte Runden',
                style: const TextStyle(color: BattleColors.mutedText,
                  fontSize: 11)),
            ],
          )),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(score == null ? '—' : '$score',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24,
                color: _modeColors[key] ?? BattleColors.gold)),
            const Text('PUNKTE',
              style: TextStyle(color: BattleColors.mutedText,
                letterSpacing: 1, fontSize: 9)),
          ]),
        ]),
      ),
    );
  }

  Widget _historyTile(GameHistoryEntry entry) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: BattleSurface(
      accent: _modeColors[entry.mode] ?? BattleColors.cyan,
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      child: Row(children: [
        _modeIcon(entry.mode),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(GameHistoryCatalog.title(entry.mode),
              style: const TextStyle(fontWeight: FontWeight.w900,
                fontSize: 13)),
            if (entry.player != null)
              Text(entry.player!,
                style: const TextStyle(color: BattleColors.cyan,
                  fontSize: 11)),
            const SizedBox(height: 4),
            Text(_date(entry.when), style: const TextStyle(
              color: BattleColors.mutedText, fontSize: 11)),
            if (entry.level != null || entry.verified)
              Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Text([
                  if (entry.level != null) 'Stufe ${entry.level}',
                  if (entry.verified) 'Online verifiziert',
                ].join('  •  '), style: const TextStyle(
                  color: BattleColors.gold, fontSize: 10)),
              ),
          ],
        )),
        const SizedBox(width: 6),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${entry.score}',
            style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900,
              color: entry.score < 0 ? BattleColors.red
                  : _modeColors[entry.mode] ?? BattleColors.gold)),
          const Text('PUNKTE', style: TextStyle(
            color: BattleColors.mutedText, fontSize: 9)),
        ]),
      ]),
    ),
  );

  Widget _modeIcon(String key) => Container(
    width: 43, height: 43,
    decoration: BoxDecoration(
      color: (_modeColors[key] ?? BattleColors.cyan).withValues(alpha: .13),
      borderRadius: BorderRadius.circular(13),
    ),
    child: Icon(_modeIcons[key] ?? Icons.sports_esports,
      color: _modeColors[key] ?? BattleColors.cyan, size: 24),
  );
}
