import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

class RankedSession {
  const RankedSession({required this.sessionId, required this.seed});
  final String sessionId;
  final int seed;
}

class OnlineService {
  OnlineService._(this.enabled);
  final bool enabled;

  static Future<OnlineService> initialize() async {
    const apiKey = String.fromEnvironment('FIREBASE_API_KEY');
    const appId = String.fromEnvironment('FIREBASE_APP_ID');
    const sender = String.fromEnvironment('FIREBASE_SENDER_ID');
    const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
    const authDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN');
    const iosBundleId = String.fromEnvironment(
      'FIREBASE_IOS_BUNDLE_ID',
      defaultValue: 'ch.battletap.battleTap',
    );
    final requiredOptions = [apiKey, appId, sender, projectId];
    if (authDomain.isEmpty && requiredOptions.every((value) => value.isEmpty)) {
      return OnlineService._(false);
    }
    if (requiredOptions.any((value) => value.isEmpty)) {
      throw StateError(
        'Firebase requires an API key, app ID, sender ID and project ID.',
      );
    }
    await Firebase.initializeApp(options: FirebaseOptions(
      apiKey: apiKey,
      appId: appId,
      messagingSenderId: sender,
      projectId: projectId,
      authDomain: authDomain.isEmpty ? null : authDomain,
      iosBundleId: iosBundleId,
    ));
    return OnlineService._(true);
  }

  User? get currentUser => enabled ? FirebaseAuth.instance.currentUser : null;
  Stream<User?> get authChanges => FirebaseAuth.instance.authStateChanges();

  Future<void> signUp(String email, String password, String nickname, String countryCode) async {
    await FirebaseAuth.instance.createUserWithEmailAndPassword(email: email.trim(), password: password);
    await configureProfile(nickname, countryCode);
  }

  Future<void> signIn(String email, String password) async {
    await FirebaseAuth.instance.signInWithEmailAndPassword(email: email.trim(), password: password);
    await ensureProfile();
  }

  Future<void> signInWithGoogle() async {
    await FirebaseAuth.instance.signInWithProvider(GoogleAuthProvider());
    await ensureProfile();
  }

  Future<void> signInWithApple() async {
    await FirebaseAuth.instance.signInWithProvider(AppleAuthProvider());
    await ensureProfile();
  }

  Future<void> ensureProfile() async {
    await _call('ensureProfile', {});
  }

  Future<void> configureProfile(String nickname, String countryCode) async {
    await _call('updateProfile', {'nickname': nickname, 'countryCode': countryCode});
  }

  Future<void> resetPassword(String email) => FirebaseAuth.instance.sendPasswordResetEmail(email: email.trim());
  Future<void> signOut() => FirebaseAuth.instance.signOut();

  Future<void> deleteAccount() async {
    await _call('deleteAccount', {});
    await FirebaseAuth.instance.signOut();
  }

  Future<Map<String, dynamic>> _call(String name, Map<String, dynamic> parameters) async {
    final result = await FirebaseFunctions.instanceFor(region: 'europe-west6').httpsCallable(name).call(parameters);
    return Map<String, dynamic>.from(result.data as Map);
  }

  Future<RankedSession> startRanked() async {
    final response = await _call('startRanked', {'rulesVersion': 2});
    if (response['rulesVersion'] != 2 || response['seed'] is! int) {
      throw StateError('Ranked V2 requires updated Firebase Cloud Functions. '
        'Please deploy functions before online Ranked play.');
    }
    return RankedSession(
      sessionId: response['sessionId'] as String,
      seed: response['seed'] as int,
    );
  }

  Future<Map<String, dynamic>> submitRanked(
    String sessionId, List<Map<String, dynamic>> taps, {
    required double fieldWidth, required double fieldHeight,
  }) => _call('submitRanked', {
    'sessionId': sessionId, 'taps': taps, 'rulesVersion': 2,
    'fieldWidth': fieldWidth, 'fieldHeight': fieldHeight,
  });

  Future<Map<String, dynamic>> myProfile() async => _call('ensureProfile', {});

  Future<void> sendFriendRequest(String battleTag) async {
    await _call('sendFriendRequest', {'battleTag': battleTag.toUpperCase().trim()});
  }

  Future<void> acceptFriendRequest(String requestId) async {
    await _call('acceptFriendRequest', {'requestId': requestId});
  }

  Future<void> sendChallenge(String opponentId) async {
    await _call('sendChallenge', {'opponentId': opponentId});
  }

  Future<void> resolveChallenge(String challengeId) async {
    await _call('resolveChallenge', {'challengeId': challengeId});
  }

  Future<List<Map<String, dynamic>>> challenges() async {
    final snapshot = await FirebaseFirestore.instance.collection('challenges')
      .where('members', arrayContains: currentUser!.uid).limit(100).get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
  }

  Future<void> blockPlayer(String userId) async {
    await _call('blockPlayer', {'userId': userId});
  }

  Future<List<Map<String, dynamic>>> leaderboard({String? countryCode, bool weekly = false}) async {
    Query<Map<String, dynamic>> query = FirebaseFirestore.instance.collection(
      weekly ? 'rankedWeeklyV2' : 'rankedBestV2',
    );
    if (weekly) {
      final today = DateTime.now().toUtc();
      final monday = today.subtract(Duration(days: today.weekday - 1));
      final key = '${monday.year}${monday.month.toString().padLeft(2, '0')}${monday.day.toString().padLeft(2, '0')}';
      query = query.where('weekKey', isEqualTo: key);
    }
    if (countryCode != null) query = query.where('countryCode', isEqualTo: countryCode);
    final snapshot = await query.orderBy('score', descending: true)
      .orderBy('achievedAt').limit(100).get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
  }

  Future<List<Map<String, dynamic>>> friendsLeaderboard({bool weekly = false}) async {
    final entries = await friendships();
    final userId = currentUser!.uid;
    final ids = <String>{userId};
    for (final entry in entries) {
      if (entry['status'] != 'accepted') continue;
      for (final member in (entry['members'] as List<dynamic>? ?? [])) {
        ids.add('$member');
      }
    }
    final today = DateTime.now().toUtc();
    final monday = today.subtract(Duration(days: today.weekday - 1));
    final key = '${monday.year}${monday.month.toString().padLeft(2, '0')}${monday.day.toString().padLeft(2, '0')}';
    final collection = FirebaseFirestore.instance.collection(weekly ? 'rankedWeeklyV2' : 'rankedBestV2');
    final result = await Future.wait(ids.take(100).map((id) async {
      final documentId = weekly ? '${key}_$id' : id;
      final document = await collection.doc(documentId).get();
      return document.exists ? {'id': id, ...document.data()!} : null;
    }));
    final ranked = result.whereType<Map<String, dynamic>>().toList();
    ranked.sort((a,b) => (b['score'] as int).compareTo(a['score'] as int));
    return ranked;
  }

  Future<List<Map<String, dynamic>>> friendships() async {
    final uid = currentUser!.uid;
    final snapshot = await FirebaseFirestore.instance.collection('friendships')
      .where('members', arrayContains: uid).limit(100).get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
  }
}
