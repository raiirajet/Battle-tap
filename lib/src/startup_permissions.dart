import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import 'local_store.dart';

/// Only notification permission is requested. Tap, sound and vibration don't
/// require access to contacts, microphone, location, photos or camera.
Future<bool> requestBattleNotifications() async {
  try {
    final status = await Permission.notification.request();
    return status.isGranted || status.isLimited;
  } catch (_) {
    return false;
  }
}

class StartupPermissionsGate extends StatefulWidget {
  const StartupPermissionsGate({
    super.key, required this.store, required this.child,
  });

  final PracticeStore store;
  final Widget child;

  @override
  State<StartupPermissionsGate> createState() => _StartupPermissionsGateState();
}

class _StartupPermissionsGateState extends State<StartupPermissionsGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !widget.store.startupChoicesSeen) _showFirstStart();
    });
  }

  Future<void> _showFirstStart() async {
    var sounds = widget.store.soundEnabled;
    var vibration = widget.store.vibrationEnabled;
    var animations = !widget.store.reducedEffects;
    var notifications = false;

    final selected = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Row(children: [
            Icon(Icons.bolt, color: Color(0xFFFFD56C)),
            SizedBox(width: 10),
            Expanded(child: Text('Dein BattleTap-Erlebnis')),
          ]),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Text(
                'Wähle deine Einstellungen. Du kannst alles später im Profil ändern.',
              ),
              const SizedBox(height: 14),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Dynamische Spielsounds'),
                subtitle: const Text('Tap-Töne steigen mit Tempo und Trefferkette'),
                value: sounds,
                onChanged: (value) => setDialogState(() => sounds = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Vibration'),
                value: vibration,
                onChanged: (value) => setDialogState(() => vibration = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Spezialeffekte'),
                subtitle: const Text('Treffer-Ringe und Combo-Animationen'),
                value: animations,
                onChanged: (value) => setDialogState(() => animations = value),
              ),
              const Divider(),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Benachrichtigungen erlauben'),
                subtitle: const Text(
                  'Optional für zukünftige Herausforderungen. '
                  'Im lokalen Übungsmodus werden noch keine Push-Nachrichten versendet.',
                ),
                value: notifications,
                onChanged: (value) => setDialogState(() => notifications = value),
              ),
            ]),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('SPÄTER'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('SPEICHERN'),
            ),
          ],
        ),
      ),
    );
    if (!mounted || selected == null) return;
    widget.store.setStartupChoicesSeen();
    if (!selected) return;

    widget.store.setSound(sounds);
    widget.store.setVibration(vibration);
    widget.store.setReducedEffects(!animations);
    if (notifications) {
      final granted = await requestBattleNotifications();
      if (!mounted) return;
      widget.store.setNotifications(granted);
      if (!granted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Benachrichtigungen sind nicht freigegeben. '
              'Du kannst dies später im Profil oder in den Systemeinstellungen ändern.'),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
