import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
const appConfig = JSON.parse(readFileSync('./src/firebase-applet-config.json', 'utf8'));

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app, appConfig.firestoreDatabaseId);

export async function getPoints(uid) {
  const snap = await db.collection('userPoints').doc(uid).get();
  return snap.exists ? snap.data().points : 0;
}

export async function setPoints(uid, amount, reason = '管理员操作') {
  const ref = db.collection('userPoints').doc(uid);
  const snap = await ref.get();
  const current = snap.exists ? (snap.data().points || 0) : 0;

  await ref.set({
    points: amount,
    totalEarned: (snap.data()?.totalEarned || 0) + Math.max(0, amount - current),
    totalSpent: snap.data()?.totalSpent || 0,
    lastCheckIn: snap.data()?.lastCheckIn || null,
    updatedAt: FieldValue.serverTimestamp(),
    ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });

  await db.collection('pointsHistory').add({
    uid,
    amount: amount - current,
    type: 'income',
    description: reason,
    source: 'admin',
    balance: amount,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`✓ ${uid}  ${current} → ${amount} 积分`);
}

export async function addPoints(uid, delta, reason = '管理员操作') {
  const current = await getPoints(uid);
  await setPoints(uid, current + delta, reason);
}

// CLI: node scripts/admin.js [get|add|set] <email> [amount] [reason]
const [cmd, email, amountStr, ...rest] = process.argv.slice(2);
if (!cmd || !email) {
  console.log('用法: node scripts/admin.js [get|add|set] <email> [amount] [reason]');
  process.exit(0);
}

const user = await auth.getUserByEmail(email);
console.log(`用户: ${user.email}  uid: ${user.uid}`);

if (cmd === 'get') {
  console.log(`当前积分: ${await getPoints(user.uid)}`);
} else if (cmd === 'add') {
  await addPoints(user.uid, parseInt(amountStr), rest.join(' ') || '管理员补发');
} else if (cmd === 'set') {
  await setPoints(user.uid, parseInt(amountStr), rest.join(' ') || '管理员设置');
}

process.exit(0);
