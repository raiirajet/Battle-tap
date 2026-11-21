import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'src/app.dart';
import 'src/local_store.dart';
import 'src/online.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final localStore = PracticeStore(prefs);
  try {
    final online = await OnlineService.initialize();
    runApp(BattleTapApp(store: localStore, online: online));
  } catch (error) {
    // Never silently present a faulty backend as a working ranked service.
    runApp(MaterialApp(home: Scaffold(body: Center(child: Padding(
      padding: const EdgeInsets.all(24),
      child: Text('Battle Tap could not initialize its online service.\n\n$error',
        textAlign: TextAlign.center),
    )))));
  }
}
