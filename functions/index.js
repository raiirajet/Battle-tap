'use strict';

const admin = require('firebase-admin');
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {randomInt} = require('crypto');
admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const region = 'europe-west6'; // Zurich, Switzerland
const callable = (handler) => onCall({region, maxInstances: 30}, handler);
const requireUser = (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  return uid;
};
const validCountry = (code) => typeof code === 'string' && /^[A-Z]{2}$/.test(code);
const validNickname = (value) => typeof value === 'string' &&
  /^[a-zA-Z0-9_\-. ]{3,24}$/.test(value) && value.trim().length >= 3;
const verifiedWeek = (now = new Date()) => {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
};

async function ensureProfile(uid) {
  const ref = db.collection('users').doc(uid);
  const existing = await ref.get();
  if (existing.exists) return existing.data();
  for (let attempt = 0; attempt < 12; attempt++) {
    const battleTag = `#BT${randomInt(100000, 1000000)}`;
    const tagRef = db.collection('battleTags').doc(battleTag);
    try {
      const newProfile = {nickname: `Player${uid.substring(0, 6)}`, battleTag,
        countryCode: 'ZZ', countryUpdatedAt: null, createdAt: FieldValue.serverTimestamp(),
        blockedUsers: [], equippedSkinId: 'standard'};
      await db.runTransaction(async (tx) => {
        const [user, tag] = await Promise.all([tx.get(ref), tx.get(tagRef)]);
        if (user.exists) return;
        if (tag.exists) throw new Error('tag-collision');
        tx.create(tagRef, {uid});
        tx.create(ref, newProfile);
      });
      const created = await ref.get();
      if (created.exists) return created.data();
    } catch (error) {
      if (String(error).includes('tag-collision')) continue;
      throw error;
    }
  }
  throw new HttpsError('resource-exhausted', 'Could not allocate a unique Battle Tag.');
}

exports.ensureProfile = callable(async (request) => {
  const uid = requireUser(request);
  const p = await ensureProfile(uid);
  return {nickname: p.nickname, battleTag: p.battleTag, countryCode: p.countryCode};
});

exports.updateProfile = callable(async (request) => {
  const uid = requireUser(request);
  const {nickname, countryCode} = request.data || {};
  if (!validNickname(nickname) || !validCountry(countryCode)) {
    throw new HttpsError('invalid-argument', 'Nickname (3-24 safe characters) and ISO country required.');
  }
  await ensureProfile(uid);
  const ref = db.collection('users').doc(uid);
  const now = admin.firestore.Timestamp.now();
  await db.runTransaction(async (tx) => {
    const p = (await tx.get(ref)).data();
    if (p.countryCode !== countryCode) {
      if (p.countryUpdatedAt && now.toMillis() - p.countryUpdatedAt.toMillis() < 30 * 86400000) {
        throw new HttpsError('failed-precondition', 'Country may change only once every 30 days.');
      }
    }
    tx.update(ref, {nickname: nickname.trim(), countryCode,
      ...(p.countryCode !== countryCode ? {countryUpdatedAt: now} : {})});
  });
  const updated = (await ref.get()).data();
  return {nickname: updated.nickname, battleTag: updated.battleTag, countryCode: updated.countryCode};
});

exports.startRanked = callable(async (request) => {
  const uid = requireUser(request);
  const profile = await ensureProfile(uid);
  if (profile.countryCode === 'ZZ') throw new HttpsError('failed-precondition', 'Choose a country in your profile.');
  const latest = await db.collection('sessions').where('uid', '==', uid)
    .orderBy('createdAt', 'desc').limit(1).get();
  if (!latest.empty) {
    const last = latest.docs[0].data();
    const when = last.createdAt && last.createdAt.toMillis();
    if (when && Date.now() - when < 5000) {
      throw new HttpsError('resource-exhausted', 'Please wait before starting another round.');
    }
  }
  const doc = db.collection('sessions').doc();
  await doc.create({uid, createdAt: FieldValue.serverTimestamp(), status: 'open',
    rulesVersion: 1, mode: 'ranked', durationMs: 30000});
  return {sessionId: doc.id, durationMs: 30000};
});

exports.submitRanked = callable(async (request) => {
  const uid = requireUser(request);
  const {sessionId, taps, rulesVersion} = request.data || {};
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9]{10,32}$/.test(sessionId)
      || rulesVersion !== 1 || !Array.isArray(taps) || taps.length > 600) {
    throw new HttpsError('invalid-argument', 'Invalid session, rules version or tap sequence.');
  }
  let prior = -1;
  for (const tap of taps) {
    if (!tap || !Number.isInteger(tap.ms) || tap.ms < 0 || tap.ms >= 30000 ||
        typeof tap.x !== 'number' || typeof tap.y !== 'number' ||
        !Number.isFinite(tap.x) || !Number.isFinite(tap.y) ||
        tap.x < 0 || tap.x > 1 || tap.y < 0 || tap.y > 1 ||
        Math.abs(tap.x - .5) > .31 || Math.abs(tap.y - .5) > .31 ||
        tap.ms - prior < 16) {
      throw new HttpsError('invalid-argument', 'Implausible or invalid touch sequence.');
    }
    prior = tap.ms;
  }
  const sessionRef = db.collection('sessions').doc(sessionId);
  const userRef = db.collection('users').doc(uid);
  const bestRef = db.collection('rankedBest').doc(uid);
  const weekKey = verifiedWeek();
  const weeklyRef = db.collection('rankedWeekly').doc(`${weekKey}_${uid}`);
  const score = taps.length; // NEVER accept a score supplied by the client.
  let newBest = false;
  await db.runTransaction(async (tx) => {
    const [sessionSnap, userSnap, oldBestSnap, oldWeekSnap] = await Promise.all([
      tx.get(sessionRef), tx.get(userRef), tx.get(bestRef), tx.get(weeklyRef)]);
    if (!sessionSnap.exists || !userSnap.exists) throw new HttpsError('not-found', 'Session not found.');
    const session = sessionSnap.data();
    if (session.uid !== uid || session.status !== 'open' || session.rulesVersion !== 1 ||
        session.mode !== 'ranked') {
      throw new HttpsError('failed-precondition', 'Session already completed or does not belong to you.');
    }
    const elapsed = Date.now() - session.createdAt.toMillis();
    if (elapsed < 28000 || elapsed > 65000) {
      throw new HttpsError('failed-precondition', 'Session time outside approved window.');
    }
    const user = userSnap.data();
    const data = {uid, nickname: user.nickname, countryCode: user.countryCode,
      score, achievedAt: FieldValue.serverTimestamp()};
    newBest = score > 0 && (!oldBestSnap.exists || score > oldBestSnap.data().score);
    if (newBest) tx.set(bestRef, data);
    if (!oldWeekSnap.exists || score > oldWeekSnap.data().score) {
      tx.set(weeklyRef, {...data, weekKey});
    }
    tx.update(sessionRef, {status: 'verified', score, verifiedAt: FieldValue.serverTimestamp()});
  });
  return {verified: true, score, newBest};
});

exports.sendFriendRequest = callable(async (request) => {
  const uid = requireUser(request);
  const tag = request.data && request.data.battleTag;
  if (typeof tag !== 'string' || !/^#BT\d{6}$/.test(tag)) {
    throw new HttpsError('invalid-argument', 'Provide a valid Battle Tag.');
  }
  const match = await db.collection('battleTags').doc(tag).get();
  if (!match.exists) throw new HttpsError('not-found', 'Battle Tag not found.');
  const to = match.data().uid;
  if (to === uid) throw new HttpsError('invalid-argument', 'You cannot befriend yourself.');
  const [a, b] = [uid, to].sort();
  const ref = db.collection('friendships').doc(`${a}_${b}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) throw new HttpsError('already-exists', 'A friendship or request already exists.');
    tx.create(ref, {members: [a,b], from: uid, to,
      status: 'pending', createdAt: FieldValue.serverTimestamp()});
  });
  return {sent: true};
});

exports.acceptFriendRequest = callable(async (request) => {
  const uid = requireUser(request);
  const {requestId} = request.data || {};
  if (typeof requestId !== 'string' || requestId.length > 150) {
    throw new HttpsError('invalid-argument', 'Invalid friend request.');
  }
  const ref = db.collection('friendships').doc(requestId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().to !== uid || snap.data().status !== 'pending') {
      throw new HttpsError('permission-denied', 'Not an incoming pending request.');
    }
    tx.update(ref, {status: 'accepted', acceptedAt: FieldValue.serverTimestamp()});
  });
  return {accepted: true};
});

exports.blockPlayer = callable(async (request) => {
  const uid = requireUser(request);
  const {userId} = request.data || {};
  if (typeof userId !== 'string' || userId === uid || userId.length > 128) {
    throw new HttpsError('invalid-argument', 'Invalid player.');
  }
  await db.collection('users').doc(uid).update({blockedUsers: FieldValue.arrayUnion(userId)});
  return {blocked: true};
});

exports.sendChallenge = callable(async (request) => {
  const uid = requireUser(request);
  const {opponentId} = request.data || {};
  if (typeof opponentId !== 'string' || opponentId === uid || opponentId.length > 128) {
    throw new HttpsError('invalid-argument', 'Invalid opponent.');
  }
  const [a, b] = [uid, opponentId].sort();
  const [friendship, ranked] = await Promise.all([
    db.collection('friendships').doc(`${a}_${b}`).get(),
    db.collection('rankedBest').doc(uid).get(),
  ]);
  if (!friendship.exists || friendship.data().status !== 'accepted') {
    throw new HttpsError('permission-denied', 'Only accepted friends can be challenged.');
  }
  if (!ranked.exists || ranked.data().score <= 0) {
    throw new HttpsError('failed-precondition', 'Play at least one verified ranked round first.');
  }
  const challengerScore = ranked.data().score;
  const ref = db.collection('challenges').doc();
  await ref.create({challengerId: uid, challengedId: opponentId, members: [uid, opponentId],
    targetScore: challengerScore, status: 'open', createdAt: FieldValue.serverTimestamp()});
  return {challengeId: ref.id, targetScore: challengerScore};
});

exports.resolveChallenge = callable(async (request) => {
  const uid = requireUser(request);
  const {challengeId} = request.data || {};
  if (typeof challengeId !== 'string' || challengeId.length > 150) {
    throw new HttpsError('invalid-argument', 'Invalid challenge.');
  }
  const ref = db.collection('challenges').doc(challengeId);
  const bestRef = db.collection('rankedBest').doc(uid);
  const result = await db.runTransaction(async (tx) => {
    const [challenge, best] = await Promise.all([tx.get(ref), tx.get(bestRef)]);
    if (!challenge.exists || challenge.data().challengedId !== uid || challenge.data().status !== 'open') {
      throw new HttpsError('permission-denied', 'Only the challenged player can resolve this open challenge.');
    }
    if (!best.exists || best.data().score <= challenge.data().targetScore ||
      best.data().achievedAt.toMillis() <= challenge.data().createdAt.toMillis()) {
      return {won: false, targetScore: challenge.data().targetScore};
    }
    tx.update(ref, {status: 'won', winningScore: best.data().score,
      resolvedAt: FieldValue.serverTimestamp()});
    return {won: true, score: best.data().score};
  });
  return result;
});

async function deleteMatching(query) {
  for (;;) {
    const snapshot = await query.limit(200).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    if (snapshot.size < 200) break;
  }
}

exports.deleteAccount = callable(async (request) => {
  const uid = requireUser(request);
  const user = await db.collection('users').doc(uid).get();
  // Erase individual records and every document that can be searched by uid.
  // Store payment records may require legally mandated retention in production;
  // that policy must be implemented explicitly before enabling real purchases.
  await deleteMatching(db.collection('rankedWeekly').where('uid', '==', uid));
  await deleteMatching(db.collection('sessions').where('uid', '==', uid));
  await deleteMatching(db.collection('friendships').where('members', 'array-contains', uid));
  await deleteMatching(db.collection('challenges').where('challengerId', '==', uid));
  await deleteMatching(db.collection('challenges').where('challengedId', '==', uid));
  await deleteMatching(db.collection('ownedSkins').where('uid', '==', uid));
  await deleteMatching(db.collection('purchases').where('uid', '==', uid));
  await deleteMatching(db.collection('securityFlags').where('uid', '==', uid));
  const batch = db.batch();
  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection('rankedBest').doc(uid));
  batch.delete(db.collection('playerStatistics').doc(uid));
  batch.delete(db.collection('achievementProgress').doc(uid));
  if (user.exists && user.data().battleTag) {
    batch.delete(db.collection('battleTags').doc(user.data().battleTag));
  }
  await batch.commit();
  await admin.auth().deleteUser(uid);
  return {deleted: true};
});
