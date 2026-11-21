import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:country_picker/country_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'game_page.dart';
import 'local_store.dart';
import 'online.dart';
import 'rules.dart';
import 'skins.dart';
import 'startup_permissions.dart';
import 'widgets/skin_button.dart';
import 'widgets/brand_assets.dart';

const gold = Color(0xFFFFD56C);
const deep = Color(0xFF090D16);
const panel = Color(0xFF151C2A);

class BattleTapApp extends StatelessWidget {
  const BattleTapApp({super.key, required this.store, required this.online});
  final PracticeStore store;
  final OnlineService online;

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'BATTLE TAP',
    theme: ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: deep,
      colorScheme: ColorScheme.fromSeed(seedColor: gold, brightness: Brightness.dark),
      cardTheme: CardThemeData(color: panel, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18))),
      appBarTheme: const AppBarTheme(backgroundColor: deep, foregroundColor: Colors.white),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
        backgroundColor: gold, foregroundColor: deep, textStyle: const TextStyle(fontWeight: FontWeight.w900),
        minimumSize: const Size(140, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)))),
    ),
    home: StartupPermissionsGate(
      store: store,
      child: online.enabled
        ? StreamBuilder<User?>(stream: online.authChanges, builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(body: Center(child: CircularProgressIndicator()));
            }
            if (snapshot.data == null) return AuthScreen(online: online);
            return HomeShell(store: store, online: online);
          })
        : HomeShell(store: store, online: online),
    ),
  );
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.online});
  final OnlineService online;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final nickname = TextEditingController();
  String countryCode = 'CH';
  bool register = false;
  bool busy = false;
  String error = '';
  @override
  void dispose() { email.dispose(); password.dispose(); nickname.dispose(); super.dispose(); }

  Future<void> _perform(Future<void> Function() action) async {
    setState(() { busy = true; error = ''; });
    try { await action(); }
    catch (e) { if (mounted) setState(() => error = '$e'); }
    finally { if (mounted) setState(() => busy = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(body: SafeArea(
    child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(28),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 440),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const BattleTapLogo(height: 152),
          const SizedBox(height: 4),
          const Text('SPEED. SKILL. GLORY.', textAlign: TextAlign.center,
            style: TextStyle(letterSpacing: 2.5, color: Colors.white54)),
          const SizedBox(height: 32),
          if (register) ...[
            TextField(controller: nickname, maxLength: 24,
              decoration: const InputDecoration(labelText: 'Player nickname', prefixIcon: Icon(Icons.person))),
            ListTile(title: const Text('Country'), subtitle: Text(countryCode),
              trailing: const Icon(Icons.public), onTap: () => showCountryPicker(
                context: context, showPhoneCode: false,
                onSelect: (country) => setState(() => countryCode = country.countryCode))),
            const SizedBox(height: 12),
          ],
          TextField(controller: email, keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline))),
          const SizedBox(height: 12),
          TextField(controller: password, obscureText: true,
            decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
          const SizedBox(height: 20),
          if (error.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 12),
            child: Text(error, style: const TextStyle(color: Colors.redAccent))),
          if (busy) const Center(child: CircularProgressIndicator()) else ...[
            FilledButton(onPressed: () => _perform(() => register
              ? widget.online.signUp(email.text, password.text, nickname.text, countryCode)
              : widget.online.signIn(email.text, password.text)),
              child: Text(register ? 'CREATE ACCOUNT' : 'SIGN IN')),
            TextButton(onPressed: () => setState(() => register = !register),
              child: Text(register ? 'Already have an account? Sign in' : 'New player? Create account')),
            OutlinedButton.icon(onPressed: () => _perform(widget.online.signInWithGoogle),
              icon: const Icon(Icons.account_circle_outlined), label: const Text('Continue with Google')),
            const SizedBox(height: 8),
            OutlinedButton.icon(onPressed: () => _perform(widget.online.signInWithApple),
              icon: const Icon(Icons.apple), label: const Text('Continue with Apple')),
            TextButton(onPressed: () => _perform(() => widget.online.resetPassword(email.text)),
              child: const Text('Reset password')),
          ],
          const SizedBox(height: 16),
          const Text('Ranked play requires a verified online account.',
            textAlign: TextAlign.center, style: TextStyle(color: Colors.white54, fontSize: 12)),
        ]))),
    )),
  );
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.store, required this.online});
  final PracticeStore store;
  final OnlineService online;
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int tab = 0;
  void _play(BattleMode mode) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => GamePage(
      mode: mode, practice: !widget.online.enabled || mode == BattleMode.hunt,
      store: widget.store, online: widget.online)));
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _PlayTab(onPlay: _play, store: widget.store, online: widget.online),
      _RanksTab(online: widget.online),
      _ShopTab(store: widget.store),
      _FriendsTab(online: widget.online),
      _ProfileTab(store: widget.store, online: widget.online),
    ];
    return Scaffold(
      body: SafeArea(child: Column(children: [
        if (!widget.online.enabled) Container(
          width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 12),
          color: const Color(0xFF5A381B),
          child: const Text('LOCAL PRACTICE ONLY • Configure Firebase for login & rankings',
            textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFFFE1A4), fontSize: 10))),
        Expanded(child: IndexedStack(index: tab, children: pages)),
      ])),
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF111827), selectedIndex: tab,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        onDestinationSelected: (index) => setState(() => tab = index),
        destinations: const [
          NavigationDestination(icon: BattleTapAppMark(size: 27), selectedIcon: BattleTapAppMark(size: 30), label: 'PLAY'),
          NavigationDestination(icon: BattleTapBadge(size: 27), selectedIcon: BattleTapBadge(size: 30), label: 'RANKS'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'SHOP'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'FRIENDS'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'PROFILE'),
        ],
      ),
    );
  }
}

class _PlayTab extends StatelessWidget {
  const _PlayTab({required this.onPlay, required this.store, required this.online});
  final void Function(BattleMode mode) onPlay;
  final PracticeStore store;
  final OnlineService online;
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const BattleTapLogo(height: 148),
      const Text('SPEED. SKILL. GLORY.', textAlign: TextAlign.center,
        style: TextStyle(color: Colors.white54, letterSpacing: 2)),
      const SizedBox(height: 24),
      AnimatedBuilder(animation: store, builder: (_, __) => Row(children: [
        Expanded(child: _Metric(label: 'LOCAL BEST', value: '${store.rankedBest}')),
        const SizedBox(width: 12),
        Expanded(child: _Metric(label: 'ROUNDS', value: '${store.gamesPlayed}')),
      ])),
      const SizedBox(height: 25),
      _ModeCard(title: 'TAP BATTLE', subtitle: '30 SECONDS • FIXED 44% BUTTON',
        icon: Icons.ads_click, accent: gold,
        detail: online.enabled ? 'RANKED • GLOBAL LEADERBOARDS' : 'PRACTICE • RANKINGS OFFLINE',
        onTap: () => onPlay(BattleMode.ranked)),
      const SizedBox(height: 14),
      _ModeCard(title: 'RANDOM HUNT', subtitle: '18–60 SECONDS • MOVING TARGET',
        icon: Icons.control_camera_rounded, accent: const Color(0xFF7DE0F8),
        detail: 'VISIBLE TIMER • −2 FOR LATE TAPS', onTap: () => onPlay(BattleMode.hunt)),
      const SizedBox(height: 24),
      const Center(child: Text('Every tap counts. No pay-to-win.',
        style: TextStyle(color: Colors.white54))),
    ]),
  );
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: panel, borderRadius: BorderRadius.circular(14)),
    child: Column(children: [Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10,
      letterSpacing: 1.7)), const SizedBox(height: 5),
      Text(value, style: const TextStyle(color: gold, fontSize: 28, fontWeight: FontWeight.w900))]),
  );
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({required this.title, required this.subtitle, required this.detail,
    required this.icon, required this.accent, required this.onTap});
  final String title;
  final String subtitle;
  final String detail;
  final IconData icon;
  final Color accent;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(borderRadius: BorderRadius.circular(18), onTap: onTap,
      child: Padding(padding: const EdgeInsets.all(19),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(color: accent.withValues(alpha: .12), borderRadius: BorderRadius.circular(15)),
            child: Icon(icon, color: accent, size: 34)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900)),
            const SizedBox(height: 3),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.white70)),
            const SizedBox(height: 6),
            Text(detail, style: TextStyle(fontSize: 10, color: accent)),
          ])),
          Icon(Icons.arrow_forward_ios_rounded, size: 16, color: accent),
        ]),
      ),
    ),
  );
}

class _RanksTab extends StatefulWidget {
  const _RanksTab({required this.online});
  final OnlineService online;
  @override
  State<_RanksTab> createState() => _RanksTabState();
}

class _RanksTabState extends State<_RanksTab> {
  int scope = 0;
  bool weekly = false;
  String country = 'CH';
  late Future<List<Map<String,dynamic>>> results;
  @override
  void initState() { super.initState(); _refresh(); }
  void _refresh() {
    results = !widget.online.enabled ? Future.value([])
      : scope == 2 ? widget.online.friendsLeaderboard(weekly: weekly)
      : widget.online.leaderboard(countryCode: scope == 1 ? country : null, weekly: weekly);
  }
  @override
  Widget build(BuildContext context) => Column(children: [
    const Padding(padding: EdgeInsets.all(18), child: Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        BattleTapBadge(size: 43),
        SizedBox(width: 10),
        Text('LEADERBOARDS',
          style: TextStyle(fontSize: 25, fontWeight: FontWeight.w900, color: gold)),
      ],
    )),
    Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: SegmentedButton<int>(
      segments: const [ButtonSegment(value: 0, label: Text('GLOBAL')),
        ButtonSegment(value: 1, label: Text('COUNTRY')),
        ButtonSegment(value: 2, label: Text('FRIENDS'))],
      selected: {scope}, onSelectionChanged: (selection) => setState(() { scope = selection.first; _refresh(); }))),
    const SizedBox(height: 12),
    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      ChoiceChip(label: const Text('ALL TIME'), selected: !weekly,
        onSelected: (_) => setState(() { weekly = false; _refresh(); })),
      const SizedBox(width: 12),
      ChoiceChip(label: const Text('WEEKLY'), selected: weekly,
        onSelected: (_) => setState(() { weekly = true; _refresh(); })),
      if (scope == 1) ...[
        const SizedBox(width: 10),
        TextButton(onPressed: () => showCountryPicker(context: context,
          onSelect: (c) => setState(() { country = c.countryCode; _refresh(); })),
          child: Text(country)),
      ],
    ]),
    Expanded(child: !widget.online.enabled
      ? const _EmptyNotice(icon: Icons.lock_outline,
        heading: 'ONLINE RANKINGS REQUIRE FIREBASE',
        description: 'Demo scores are stored only on this device and never appear on a public ranking.')
        : FutureBuilder<List<Map<String,dynamic>>>(future: results, builder: (context, snapshot) {
          if (snapshot.hasError) return _EmptyNotice(icon: Icons.error_outline,
            heading: 'CAN’T LOAD SCORES', description: '${snapshot.error}');
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          if (snapshot.data!.isEmpty) return const _EmptyNotice(icon: Icons.emoji_events_outlined,
            heading: 'NO VERIFIED SCORES YET', description: 'Be the first player on the leaderboard.');
          return RefreshIndicator(onRefresh: () async {setState(_refresh); await results;},
            child: ListView.builder(itemCount: snapshot.data!.length, itemBuilder: (context, index) {
              final row = snapshot.data![index];
              return ListTile(leading: CircleAvatar(backgroundColor: panel,
                  child: Text('${index + 1}', style: const TextStyle(color: gold))),
                title: Text('${row['nickname'] ?? 'Player'}'),
                subtitle: Text('${row['countryCode'] ?? ''}'),
                trailing: Text('${row['score'] ?? 0}', style: const TextStyle(fontSize: 20,
                  fontWeight: FontWeight.w900, color: gold)));
            }));
        })),
  ]);
}

class _ShopTab extends StatefulWidget {
  const _ShopTab({required this.store});
  final PracticeStore store;
  @override
  State<_ShopTab> createState() => _ShopTabState();
}

class _ShopTabState extends State<_ShopTab> {
  SkinRarity rarity = SkinRarity.normal;
  @override
  Widget build(BuildContext context) {
    final selection = skins.where((skin) => skin.rarity == rarity).toList();
    return Column(children: [
      const Padding(padding: EdgeInsets.all(20), child: Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          BattleTapBadge(size: 41),
          SizedBox(width: 10),
          Text('BATTLE SHOP', style: TextStyle(color: gold, fontSize: 25, fontWeight: FontWeight.w900)),
        ]),
        SizedBox(height: 4), Text('COSMETICS ONLY • NO PAY-TO-WIN',
          style: TextStyle(color: Colors.white54, fontSize: 11)),
      ])),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: SegmentedButton<SkinRarity>(
        segments: const [ButtonSegment(value: SkinRarity.normal, label: Text('NORMAL')),
          ButtonSegment(value: SkinRarity.epic, label: Text('EPIC')),
          ButtonSegment(value: SkinRarity.legend, label: Text('LEGEND'))],
        selected: {rarity}, onSelectionChanged: (v) => setState(() => rarity = v.first))),
      const SizedBox(height: 12),
      Expanded(child: GridView.builder(padding: const EdgeInsets.all(14),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: .69),
        itemCount: selection.length,
        itemBuilder: (context, index) {
          final skin = selection[index];
          return Card(child: InkWell(borderRadius: BorderRadius.circular(18), onTap: () => _preview(skin),
            child: Padding(padding: const EdgeInsets.all(9), child: Column(children: [
              Expanded(child: Center(child: LayoutBuilder(builder: (context, constraints) =>
                SkinButton(skin: skin, size: constraints.maxWidth.clamp(80.0, 155.0).toDouble())))),
              Text(skin.name, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
              Text(skin.price, style: const TextStyle(color: gold, fontSize: 12)),
              const SizedBox(height: 4),
              const Text('TAP TO PREVIEW', style: TextStyle(color: Colors.white38, fontSize: 9)),
            ]))));
        })),
    ]);
  }

  void _preview(BattleSkin skin) => showModalBottomSheet<void>(context: context,
    isScrollControlled: true, showDragHandle: true, backgroundColor: panel,
    builder: (context) => Padding(padding: const EdgeInsets.all(24), child: Column(
      mainAxisSize: MainAxisSize.min, children: [
      Text(skin.name, style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w900, color: gold)),
      Text(skin.rarity.name.toUpperCase(), style: const TextStyle(letterSpacing: 2, color: Colors.white54)),
      const SizedBox(height: 20),
      SkinButton(skin: skin, size: 200),
      const SizedBox(height: 20),
      Text(skin.description),
      const SizedBox(height: 10),
      Text(skin.price, style: const TextStyle(fontSize: 21, color: gold, fontWeight: FontWeight.bold)),
      const SizedBox(height: 12),
      const Text('Purchases are locked until the native store products and server receipt verification are configured.',
        style: TextStyle(color: Colors.white54), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      const FilledButton(onPressed: null, child: Text('PURCHASE UNAVAILABLE')),
      const SizedBox(height: 20),
    ])));
}

class _FriendsTab extends StatefulWidget {
  const _FriendsTab({required this.online});
  final OnlineService online;
  @override
  State<_FriendsTab> createState() => _FriendsTabState();
}

class _FriendsTabState extends State<_FriendsTab> {
  final tagController = TextEditingController();
  String notice = '';
  Future<List<Map<String,dynamic>>>? future;
  @override
  void initState() { super.initState(); if (widget.online.enabled) future = widget.online.friendships(); }
  @override
  void dispose() { tagController.dispose(); super.dispose(); }
  Future<void> _invite() async {
    try {
      await widget.online.sendFriendRequest(tagController.text);
      setState(() { notice = 'Invitation sent'; future = widget.online.friendships(); });
    } catch (e) { setState(() => notice = '$e'); }
  }
  void _showChallenges() => showModalBottomSheet<void>(context: context,
    isScrollControlled: true, showDragHandle: true, backgroundColor: panel,
    builder: (dialogContext) => SafeArea(child: SizedBox(height: 450,
      child: FutureBuilder<List<Map<String,dynamic>>>(future: widget.online.challenges(),
        builder: (dialogContext, snapshot) {
          if (snapshot.hasError) return Center(child: Text('${snapshot.error}'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          if (snapshot.data!.isEmpty) return const Center(child: Text('No challenges yet'));
          return ListView(children: [
            const ListTile(title: Text('SCORE CHALLENGES', style: TextStyle(color: gold, fontWeight: FontWeight.w900))),
            ...snapshot.data!.map((item) => ListTile(
              title: Text('Beat ${item['targetScore'] ?? 0} TAPS'),
              subtitle: Text('Status: ${item['status']}'),
              trailing: item['status'] == 'open' && item['challengedId'] == widget.online.currentUser?.uid
                ? TextButton(onPressed: () async {
                    try { await widget.online.resolveChallenge('${item['id']}');
                      if (dialogContext.mounted) Navigator.of(dialogContext).pop();
                    } catch (e) {
                      if (dialogContext.mounted) ScaffoldMessenger.of(dialogContext)
                        .showSnackBar(SnackBar(content: Text('$e')));
                    }
                  }, child: const Text('CHECK')) : null,
            )),
          ]);
        }),
    )));

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(20), child: Column(children: [
      const Text('FRIENDS', style: TextStyle(fontSize: 25, color: gold, fontWeight: FontWeight.w900)),
      const SizedBox(height: 12),
      if (!widget.online.enabled) const Expanded(child: _EmptyNotice(icon: Icons.people_outline,
        heading: 'FRIENDS ARE ONLINE-ONLY', description: 'Connect Firebase to search and invite players.'))
      else ...[
        Row(children: [
          Expanded(child: TextField(controller: tagController,
            decoration: const InputDecoration(labelText: 'Battle tag (e.g. #BT58294)'))),
          IconButton(onPressed: _invite, icon: const Icon(Icons.person_add_alt_1, color: gold)),
        ]),
        if (notice.isNotEmpty) Text(notice, style: const TextStyle(color: Colors.white70)),
        const SizedBox(height: 10),
        TextButton.icon(onPressed: _showChallenges, icon: const Icon(Icons.flag_outlined),
          label: const Text('VIEW SCORE CHALLENGES')),
        const SizedBox(height: 6),
        Expanded(child: FutureBuilder<List<Map<String,dynamic>>>(future: future,
          builder: (context, snapshot) {
            if (snapshot.hasError) return Text('${snapshot.error}');
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            if (snapshot.data!.isEmpty) return const _EmptyNotice(icon: Icons.group_add,
              heading: 'NO FRIENDS YET', description: 'Add friends using their Battle Tag.');
            return ListView(children: snapshot.data!.map((friend) {
              final pending = friend['status'] == 'pending';
              final id = '${friend['id']}';
              return ListTile(
                leading: const CircleAvatar(child: Icon(Icons.person)),
                title: Text(pending ? 'Friend request' : 'Battle friend'),
                subtitle: Text(id),
                trailing: pending && friend['to'] == widget.online.currentUser?.uid ? TextButton(onPressed: () async {
                  try { await widget.online.acceptFriendRequest(id);
                    setState(() => future = widget.online.friendships()); }
                  catch (e) { setState(() => notice = '$e'); }
                }, child: const Text('ACCEPT')) : pending
                  ? const Icon(Icons.hourglass_top, color: Colors.orange)
                  : IconButton(tooltip: 'Challenge friend', icon: const Icon(Icons.emoji_events_outlined, color: gold),
                    onPressed: () async {
                      final members = (friend['members'] as List<dynamic>?) ?? [];
                      final other = members.map((e) => '$e').where((e) => e != widget.online.currentUser?.uid).firstOrNull;
                      if (other == null) return;
                      try { await widget.online.sendChallenge(other);
                        if (mounted) setState(() => notice = 'Score challenge sent'); }
                      catch (e) { if (mounted) setState(() => notice = '$e'); }
                    }),
              );
            }).toList());
          })),
      ],
    ]),
  );
}

class _ProfileTab extends StatefulWidget {
  const _ProfileTab({required this.store, required this.online});
  final PracticeStore store;
  final OnlineService online;
  @override
  State<_ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<_ProfileTab> {
  Future<Map<String,dynamic>>? profile;
  @override
  void initState() { super.initState(); if (widget.online.enabled) profile = widget.online.myProfile(); }
  @override
  Widget build(BuildContext context) => SingleChildScrollView(padding: const EdgeInsets.all(20),
    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const Center(child: BattleTapBadge(size: 96)),
      const SizedBox(height: 10),
      Text(widget.online.currentUser?.email ?? 'Local Practice Player', textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      const SizedBox(height: 10),
      if (profile != null) FutureBuilder<Map<String,dynamic>>(future: profile,
        builder: (context, snapshot) => Text(snapshot.hasData
          ? '${snapshot.data!['nickname'] ?? ''}  •  ${snapshot.data!['battleTag'] ?? ''}  •  ${snapshot.data!['countryCode'] ?? ''}'
          : 'Loading profile...', textAlign: TextAlign.center, style: const TextStyle(color: gold))),
      if (widget.online.enabled) OutlinedButton.icon(
        onPressed: () async {
          Map<String,dynamic>? info;
          try { info = await widget.online.myProfile(); } catch (_) { return; }
          if (!context.mounted) return;
          final name = TextEditingController(text: '${info['nickname'] ?? ''}');
          var iso = '${info['countryCode'] ?? 'CH'}';
          final saved = await showDialog<bool>(context: context, builder: (dialogContext) =>
            StatefulBuilder(builder: (dialogContext, setDialogState) => AlertDialog(
              title: const Text('Edit player profile'),
              content: Column(mainAxisSize: MainAxisSize.min, children: [
                TextField(controller: name, decoration: const InputDecoration(labelText: 'Nickname')),
                ListTile(title: const Text('Country'), subtitle: Text(iso),
                  trailing: const Icon(Icons.public), onTap: () => showCountryPicker(
                    context: dialogContext, onSelect: (c) => setDialogState(() => iso = c.countryCode))),
              ]),
              actions: [TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('CANCEL')),
                FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('SAVE'))],
            )));
          if (saved == true) {
            try { await widget.online.configureProfile(name.text, iso);
              if (mounted) setState(() => profile = widget.online.myProfile());
            } catch (e) {
              if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
            }
          }
          name.dispose();
        }, icon: const Icon(Icons.edit), label: const Text('EDIT PROFILE')),
      const SizedBox(height: 20),
      AnimatedBuilder(animation: widget.store, builder: (_, __) => Column(children: [
        _Metric(label: 'LOCAL RANKED BEST', value: '${widget.store.rankedBest}'),
        const SizedBox(height: 10),
        _Metric(label: 'LOCAL HUNT BEST', value: '${widget.store.huntBest}'),
        const SizedBox(height: 10),
        _Metric(label: 'TOTAL TAPS ON DEVICE', value: '${widget.store.totalHits}'),
      ])),
      const SizedBox(height: 16),
      AnimatedBuilder(animation: widget.store, builder: (context, _) => Column(children: [
        SwitchListTile(
          title: const Text('Spielsounds'),
          subtitle: const Text('Originale BattleTap-Treffer- und Rekordklänge'),
          value: widget.store.soundEnabled,
          onChanged: widget.store.setSound,
        ),
        SwitchListTile(
          title: const Text('Dynamische Tap-Töne'),
          subtitle: const Text('Klangstufen steigen mit Treffern, Tempo und Combos'),
          value: widget.store.adaptiveAudioEnabled,
          onChanged: widget.store.soundEnabled ? widget.store.setAdaptiveAudio : null,
        ),
        ListTile(
          title: const Text('Sound-Lautstärke'),
          subtitle: Slider(
            min: 0, max: 1, divisions: 10,
            value: widget.store.soundVolume,
            label: '${(widget.store.soundVolume * 100).round()} %',
            onChanged: widget.store.soundEnabled ? widget.store.setSoundVolume : null,
          ),
        ),
        SwitchListTile(title: const Text('Vibration'), value: widget.store.vibrationEnabled,
          onChanged: widget.store.setVibration),
        SwitchListTile(title: const Text('Weniger Animationen'), value: widget.store.reducedEffects,
          onChanged: widget.store.setReducedEffects),
        SwitchListTile(
          title: const Text('Benachrichtigungen'),
          subtitle: const Text('Optional für zukünftige Challenges und Einladungen'),
          value: widget.store.notificationsEnabled,
          onChanged: (enabled) async {
            if (!enabled) {
              widget.store.setNotifications(false);
              return;
            }
            final granted = await requestBattleNotifications();
            if (!mounted) return;
            widget.store.setNotifications(granted);
            if (!granted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: const Text('Benachrichtigungen wurden nicht freigegeben.'),
                action: SnackBarAction(label: 'EINSTELLUNGEN',
                    onPressed: () { openAppSettings(); }),
              ));
            }
          },
        ),
      ])),
      const SizedBox(height: 8),
      if (widget.online.enabled) ...[
        OutlinedButton(onPressed: () => widget.online.signOut(), child: const Text('SIGN OUT')),
        OutlinedButton(onPressed: () async {
          final confirmed = await showDialog<bool>(context: context, builder: (context) => AlertDialog(
            title: const Text('Permanently delete account?'),
            content: const Text('Your profile, scores, friendships and purchases will be removed or processed according to the privacy policy. This cannot be undone.'),
            actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCEL')),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('DELETE'))]));
          if (confirmed == true) {
            try { await widget.online.deleteAccount(); }
            catch (e) { if (context.mounted) ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Delete failed: $e'))); }
          }
        }, child: const Text('DELETE ACCOUNT', style: TextStyle(color: Colors.redAccent))),
      ],
      const Text('Language selection and full privacy controls remain planned before release.',
        textAlign: TextAlign.center, style: TextStyle(color: Colors.white38, fontSize: 12)),
    ]));
}

class _EmptyNotice extends StatelessWidget {
  const _EmptyNotice({required this.icon, required this.heading, required this.description});
  final IconData icon;
  final String heading;
  final String description;
  @override
  Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(25),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: gold, size: 55), const SizedBox(height: 15),
      Text(heading, textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
      const SizedBox(height: 12),
      Text(description, textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.white60)),
    ])));
}
