import crypto from 'node:crypto';
import fs from 'node:fs';
import type {IncomingMessage, ServerResponse} from 'node:http';
import os from 'node:os';
import path from 'node:path';

interface AdminCredentialFile {
  salt: string;
  hash: string;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const CLAIM_FILE = path.join(os.tmpdir(), 'vision_shop_admin_claim.json');
const MAX_BODY_BYTES = 16 * 1024;

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const loginAttempts = new Map<string, number[]>();

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function isRateLimited(ip: string): boolean {
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

export function getEnvPasscode(): string {
  return (process.env.ADMIN_PASSCODE ?? '').trim();
}

export function readClaimedAdmin(): AdminCredentialFile | null {
  if (!fs.existsSync(CLAIM_FILE)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(CLAIM_FILE, 'utf8')) as Partial<AdminCredentialFile>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return {salt: parsed.salt, hash: parsed.hash};
    }
  } catch {
    return null;
  }
  return null;
}

export function writeClaimedAdmin(password: string): boolean {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    fs.writeFileSync(CLAIM_FILE, JSON.stringify({salt, hash}), {
      encoding: 'utf8',
      flag: 'wx',
    });
    return true;
  } catch {
    return false;
  }
}

export function isAdminConfigured(): boolean {
  return getEnvPasscode().length > 0 || readClaimedAdmin() !== null;
}

function timingSafeEqualsText(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

export function verifyPassword(password: string): boolean {
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

export function signSessionToken(): string {
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

export function verifySessionToken(token: string): boolean {
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

export function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readJsonBody(
  req: IncomingMessage & {body?: unknown},
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  return await new Promise<Record<string, unknown>>((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let aborted = false;

    req.on('data', (chunk: Buffer | string) => {
      if (aborted) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        aborted = true;
        resolve({});
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (aborted) return;
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });

    req.on('error', () => {
      if (!aborted) resolve({});
    });
  });
}
