import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const JWT_SECRET = process.env.JWT_SECRET || 'ems-super-secret-2026';
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const ALLOWED_SUBDIRS = ['logos', 'backgrounds', 'announcements', 'profiles'];

for (const d of ALLOWED_SUBDIRS) {
  const p = path.join(UPLOADS_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safeFilePath(subDir: string, filename: string): string | null {
  if (!ALLOWED_SUBDIRS.includes(subDir)) return null;
  const baseDir = path.resolve(UPLOADS_DIR, subDir);
  const full = path.resolve(baseDir, filename);
  if (!full.startsWith(baseDir) || filename.includes('..')) return null;
  if (!fs.existsSync(full)) return null;
  return full;
}

const app = express();
import studentRoutes from './src/routes/student';
import authRoutes from './src/routes/auth';

app.use(cors());
app.use(express.json());

app.get('/api/before', (req, res) => res.json({ before: true }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

app.get('/api/after', (req, res) => res.json({ after: true }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(5018, () => {
  async function test() {
    const tests = ['/api/before', '/api/after', '/api/health', '/api/files/logos/test'];
    for (const t of tests) {
      const r = await fetch(`http://localhost:5018${t}`);
      const text = await r.text();
      console.log(`${t}: ${r.status} ${text.substring(0, 80)}`);
    }
  }
  test().then(() => server.close()).catch(() => server.close());
});
