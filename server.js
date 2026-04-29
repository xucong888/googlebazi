import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'xhcg-secret-key-2024';
const JWT_EXPIRES = '30d';
const FREE_REGISTER_POINTS = 100;
const DAILY_CHECKIN_POINTS = 5;

// SQLite init
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'app.db');
mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
  CREATE TABLE IF NOT EXISTS points (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    last_checkin INTEGER
  );
  CREATE TABLE IF NOT EXISTS points_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL,
    balance INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
  CREATE TABLE IF NOT EXISTS fate_history (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    birth_info TEXT NOT NULL,
    fate_data TEXT NOT NULL,
    ai_report TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
`);

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

// --- Auth routes ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少需要6位字符' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: '该邮箱已注册，请直接登录' });
  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?,?,?)').run(email, hash, name || '');
  const uid = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO points (user_id, balance, total_earned) VALUES (?,?,?)').run(uid, FREE_REGISTER_POINTS, FREE_REGISTER_POINTS);
  db.prepare('INSERT INTO points_history (user_id,amount,type,description,source,balance) VALUES (?,?,?,?,?,?)').run(uid, FREE_REGISTER_POINTS, 'income', '新用户注册奖励', 'register', FREE_REGISTER_POINTS);
  const token = jwt.sign({ uid, email, name: name || '' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ token, user: { uid, email, name: name || '', points: FREE_REGISTER_POINTS } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: '该邮箱尚未注册，请先注册账户' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: '密码错误，请重试' });
  const pts = db.prepare('SELECT balance FROM points WHERE user_id = ?').get(user.id);
  const token = jwt.sign({ uid: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ token, user: { uid: user.id, email: user.email, name: user.name, points: pts?.balance ?? 0 } });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.user.uid);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const pts = db.prepare('SELECT balance FROM points WHERE user_id = ?').get(user.id);
  res.json({ uid: user.id, email: user.email, name: user.name, points: pts?.balance ?? 0 });
});

// --- Points routes ---
app.get('/api/points', authenticate, (req, res) => {
  const pts = db.prepare('SELECT balance FROM points WHERE user_id = ?').get(req.user.uid);
  res.json({ points: pts?.balance ?? 0 });
});

app.post('/api/points/use', authenticate, (req, res) => {
  const { amount, description } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: '无效积分数量' });
  const result = db.transaction(() => {
    const pts = db.prepare('SELECT balance FROM points WHERE user_id = ?').get(req.user.uid);
    const bal = pts?.balance ?? 0;
    if (bal < amount) return { success: false, message: `积分不足，需要 ${amount} 积分，当前 ${bal} 积分` };
    const newBal = bal - amount;
    db.prepare('UPDATE points SET balance=?, total_spent=total_spent+? WHERE user_id=?').run(newBal, amount, req.user.uid);
    db.prepare('INSERT INTO points_history (user_id,amount,type,description,source,balance) VALUES (?,?,?,?,?,?)').run(req.user.uid, -amount, 'expense', description || '积分消耗', 'consumption', newBal);
    return { success: true, message: `已消耗 ${amount} 积分`, balance: newBal };
  })();
  res.json(result);
});

app.post('/api/points/add', authenticate, (req, res) => {
  const { amount, description, source } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: '无效积分数量' });
  const result = db.transaction(() => {
    const pts = db.prepare('SELECT balance FROM points WHERE user_id = ?').get(req.user.uid);
    const bal = pts?.balance ?? 0;
    const newBal = bal + amount;
    if (pts) {
      db.prepare('UPDATE points SET balance=?, total_earned=total_earned+? WHERE user_id=?').run(newBal, amount, req.user.uid);
    } else {
      db.prepare('INSERT INTO points (user_id, balance, total_earned) VALUES (?,?,?)').run(req.user.uid, newBal, amount);
    }
    db.prepare('INSERT INTO points_history (user_id,amount,type,description,source,balance) VALUES (?,?,?,?,?,?)').run(req.user.uid, amount, 'income', description || '积分充值', source || 'purchase', newBal);
    return { success: true, balance: newBal };
  })();
  res.json(result);
});

app.post('/api/points/checkin', authenticate, (req, res) => {
  const pts = db.prepare('SELECT balance, last_checkin FROM points WHERE user_id = ?').get(req.user.uid);
  if (!pts) return res.status(400).json({ success: false, message: '用户数据不存在' });
  const now = Math.floor(Date.now() / 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartSec = Math.floor(todayStart.getTime() / 1000);
  if (pts.last_checkin && pts.last_checkin >= todayStartSec) {
    return res.json({ success: false, message: '今日已签到，明天再来吧' });
  }
  const bonus = DAILY_CHECKIN_POINTS;
  const newBal = pts.balance + bonus;
  db.prepare('UPDATE points SET balance=?, total_earned=total_earned+?, last_checkin=? WHERE user_id=?').run(newBal, bonus, now, req.user.uid);
  db.prepare('INSERT INTO points_history (user_id,amount,type,description,source,balance) VALUES (?,?,?,?,?,?)').run(req.user.uid, bonus, 'income', `每日签到 +${bonus} 积分`, 'daily_checkin', newBal);
  res.json({ success: true, message: `签到成功，获得 ${bonus} 积分`, balance: newBal });
});

app.get('/api/points/history', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.uid);
  res.json(rows.map(r => ({
    id: r.id,
    amount: r.amount,
    type: r.type,
    description: r.description,
    source: r.source,
    balance: r.balance,
    createdAt: r.created_at * 1000,
  })));
});

// --- Fate history routes ---
app.get('/api/history', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM fate_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.uid);
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    birthInfo: JSON.parse(r.birth_info),
    fateData: JSON.parse(r.fate_data),
    aiReport: r.ai_report,
    createdAt: r.created_at * 1000,
  })));
});

app.post('/api/history', authenticate, (req, res) => {
  const { name, birthInfo, fateData, aiReport } = req.body || {};
  if (!name || !birthInfo || !fateData) return res.status(400).json({ error: '数据不完整' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO fate_history (id, user_id, name, birth_info, fate_data, ai_report) VALUES (?,?,?,?,?,?)').run(id, req.user.uid, name, JSON.stringify(birthInfo), JSON.stringify(fateData), aiReport || null);
  res.json({ id });
});

app.delete('/api/history/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM fate_history WHERE id = ? AND user_id = ?').run(req.params.id, req.user.uid);
  res.json({ ok: true });
});

app.patch('/api/history/:id', authenticate, (req, res) => {
  const { aiReport } = req.body || {};
  db.prepare('UPDATE fate_history SET ai_report = ? WHERE id = ? AND user_id = ?').run(aiReport || null, req.params.id, req.user.uid);
  res.json({ ok: true });
});

// Proxy DeepSeek AI calls — keeps API key server-side
app.use('/deepseek-api', async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  const targetUrl = `https://api.deepseek.com${req.url}`;

  try {
    // express.json() already parsed req.body — re-serialize for the upstream request
    const bodyStr = (req.method !== 'GET' && req.body !== undefined)
      ? JSON.stringify(req.body)
      : undefined;

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: bodyStr,
    });

    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (!['transfer-encoding', 'connection', 'content-encoding', 'content-length'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    if (!upstream.body) { res.end(); return; }

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error('DeepSeek proxy error:', err);
    if (!res.headersSent) res.status(502).json({ error: 'AI service unavailable' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

createServer(app).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
