import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type {NextFunction, Request, Response} from 'express';

type RarityCode = '' | 'N' | 'M' | 'R' | 'F';

interface ProductRecord {
  id: number;
  name: string;
  price: number;
  gemValue: number;
  imageUrl: string;
  rarity: RarityCode;
}

interface AdminCredentialFile {
  salt: string;
  hash: string;
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const DEFAULT_PRODUCTS: ProductRecord[] = [
  {id: 1, name: '', price: 49, gemValue: 1.2, imageUrl: '', rarity: ''},
  {id: 2, name: '', price: 99, gemValue: 2.5, imageUrl: '', rarity: ''},
  {id: 3, name: '', price: 149, gemValue: 3.7, imageUrl: '', rarity: ''},
  {id: 4, name: '', price: 199, gemValue: 5, imageUrl: '', rarity: ''},
];

function normalizeRarity(value: unknown): RarityCode | null {
  if (value === undefined || value === null || value === '') return '';
  if (value === 'N' || value === 'M' || value === 'R' || value === 'F') {
    return value;
  }
  return null;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
}

function loadProducts(): ProductRecord[] {
  ensureDataDir();
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2), 'utf8');
    return [...DEFAULT_PRODUCTS];
  }
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is Omit<ProductRecord, 'rarity'> & {rarity?: unknown} =>
            Boolean(item) &&
            typeof item.id === 'number' &&
            typeof item.name === 'string' &&
            typeof item.price === 'number' &&
            typeof item.gemValue === 'number' &&
            typeof item.imageUrl === 'string',
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          gemValue: item.gemValue,
          imageUrl: item.imageUrl,
          rarity: normalizeRarity(item.rarity) ?? '',
        }));
    }
  } catch {
    // Fallback to defaults if corrupted
  }
  return [...DEFAULT_PRODUCTS];
}

function saveProducts(products: ProductRecord[]): void {
  ensureDataDir();
  const tmpFile = `${PRODUCTS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(products, null, 2), 'utf8');
  fs.renameSync(tmpFile, PRODUCTS_FILE);
}

let productsStore: ProductRecord[] = loadProducts();
const sseClients = new Set<Response>();

function broadcastProducts(): void {
  const payload = `event: products\ndata: ${JSON.stringify(productsStore)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

function getEnvPasscode(): string {
  return (process.env.ADMIN_PASSCODE ?? '').trim();
}

function readClaimedAdmin(): AdminCredentialFile | null {
  if (!fs.existsSync(ADMIN_FILE)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8')) as Partial<AdminCredentialFile>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return {salt: parsed.salt, hash: parsed.hash};
    }
  } catch {
    return null;
  }
  return null;
}

function isAdminConfigured(): boolean {
  return getEnvPasscode().length > 0 || readClaimedAdmin() !== null;
}

function timingSafeEqualsText(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function verifyPassword(password: string): boolean {
  const envPasscode = getEnvPasscode();
  if (envPasscode.length > 0) {
    return timingSafeEqualsText(password, envPasscode);
  }
  const claimed = readClaimedAdmin();
  if (!claimed) return false;
  try {
    const derived = crypto.scryptSync(password, claimed.salt, 64);
    const stored = Buffer.from(claimed.hash, 'hex');
    if (derived.length !== stored.length) return false;
    return crypto.timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

function signSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + SESSION_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  const bufA = Buffer.from(sigB64);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({error: 'Требуется авторизация администратора'});
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifySessionToken(token)) {
    res.status(401).json({error: 'Сессия администратора недействительна или истекла'});
    return;
  }
  next();
}

const loginAttempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (loginAttempts.get(ip) ?? []).filter((ts) => now - ts < 60_000);
  if (recent.length >= 12) {
    loginAttempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  loginAttempts.set(ip, recent);
  return false;
}

function validateImageUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('data:')) {
    if (
      trimmed.length <= 1_500_000 &&
      /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
    ) {
      return trimmed;
    }
    return null;
  }
  if (trimmed.length > 2048) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

function validateProductPayload(
  body: unknown,
): {ok: true; data: Omit<ProductRecord, 'id'>} | {ok: false; error: string} {
  if (!body || typeof body !== 'object') {
    return {ok: false, error: 'Некорректные данные товара'};
  }
  const obj = body as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (name.length > 80) {
    return {ok: false, error: 'Название товара не должно превышать 80 символов'};
  }

  const price = Number(obj.price);
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return {ok: false, error: 'Укажите корректную цену от 0 до 1 000 000'};
  }

  const gemValue = Number(obj.gemValue);
  if (!Number.isFinite(gemValue) || gemValue < 0 || gemValue > 1_000_000) {
    return {ok: false, error: 'Укажите корректное количество гемов от 0 до 1 000 000'};
  }

  const imageUrl = validateImageUrl(obj.imageUrl);
  if (imageUrl === null) {
    return {ok: false, error: 'Недопустимая ссылка или формат изображения'};
  }

  const rarity = normalizeRarity(obj.rarity);
  if (rarity === null) {
    return {ok: false, error: 'Недопустимое значение редкости'};
  }

  return {
    ok: true,
    data: {
      name,
      price: Math.round(price * 100) / 100,
      gemValue: Math.round(gemValue * 100) / 100,
      imageUrl,
      rarity,
    },
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({limit: '2mb'}));

  // Public product list
  app.get('/api/products', (_req, res) => {
    res.json({products: productsStore});
  });

  // Real-time Server-Sent Events stream for all visitors
  app.get('/api/products/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`event: products\ndata: ${JSON.stringify(productsStore)}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Admin auth status
  app.get('/api/admin/status', (req, res) => {
    const authHeader = req.headers.authorization;
    const authenticated =
      Boolean(authHeader && authHeader.startsWith('Bearer ')) &&
      verifySessionToken((authHeader ?? '').slice('Bearer '.length).trim());

    res.json({
      configured: isAdminConfigured(),
      authenticated,
    });
  });

  // One-time first-run admin setup when ADMIN_PASSCODE is not yet configured in environment
  app.post('/api/admin/claim', (req, res) => {
    const ip = req.ip || 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({error: 'Слишком много попыток. Подождите минуту.'});
      return;
    }

    if (isAdminConfigured()) {
      res.status(409).json({error: 'Пароль администратора уже настроен'});
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({error: 'Пароль должен содержать от 6 до 128 символов'});
      return;
    }

    ensureDataDir();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
      fs.writeFileSync(ADMIN_FILE, JSON.stringify({salt, hash}, null, 2), {
        encoding: 'utf8',
        flag: 'wx',
      });
    } catch {
      res.status(409).json({error: 'Пароль администратора уже настроен'});
      return;
    }

    res.json({token: signSessionToken()});
  });

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({error: 'Слишком много попыток. Подождите минуту.'});
      return;
    }

    if (!isAdminConfigured()) {
      res.status(409).json({error: 'Сначала задайте пароль администратора'});
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (!password || password.length > 128 || !verifyPassword(password)) {
      res.status(401).json({error: 'Неверный пароль администратора'});
      return;
    }

    res.json({token: signSessionToken()});
  });

  // Admin CRUD: Add product
  app.post('/api/products', requireAdmin, (req, res) => {
    const parsed = validateProductPayload(req.body);
    if (!parsed.ok) {
      res.status(400).json({error: parsed.error});
      return;
    }

    const nextId =
      productsStore.reduce((maxId, item) => (item.id > maxId ? item.id : maxId), 0) + 1;
    const created: ProductRecord = {
      id: nextId,
      ...parsed.data,
    };

    productsStore = [...productsStore, created];
    saveProducts(productsStore);
    broadcastProducts();
    res.status(201).json({product: created, products: productsStore});
  });

  // Admin CRUD: Edit product
  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({error: 'Некорректный ID товара'});
      return;
    }

    const index = productsStore.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({error: 'Товар не найден'});
      return;
    }

    const parsed = validateProductPayload(req.body);
    if (!parsed.ok) {
      res.status(400).json({error: parsed.error});
      return;
    }

    const updated: ProductRecord = {id, ...parsed.data};
    productsStore = productsStore.map((item) => (item.id === id ? updated : item));
    saveProducts(productsStore);
    broadcastProducts();
    res.json({product: updated, products: productsStore});
  });

  // Admin CRUD: Delete product
  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({error: 'Некорректный ID товара'});
      return;
    }

    const exists = productsStore.some((item) => item.id === id);
    if (!exists) {
      res.status(404).json({error: 'Товар не найден'});
      return;
    }

    productsStore = productsStore.filter((item) => item.id !== id);
    saveProducts(productsStore);
    broadcastProducts();
    res.json({products: productsStore});
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vision shop server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
