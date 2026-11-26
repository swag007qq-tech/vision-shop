import type {IncomingMessage, ServerResponse} from 'node:http';
import {
  getClientIp,
  isAdminConfigured,
  isRateLimited,
  readJsonBody,
  sendJson,
  signSessionToken,
  verifyPassword,
} from './_auth';

export default async function handler(
  req: IncomingMessage & {body?: unknown},
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    sendJson(res, 429, {error: 'Слишком много попыток. Подождите минуту.'});
    return;
  }

  if (!isAdminConfigured()) {
    sendJson(res, 409, {
      error:
        'Сначала задайте пароль администратора или добавьте переменную ADMIN_PASSCODE в настройках Vercel',
    });
    return;
  }

  const body = await readJsonBody(req);
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if (!password || password.length > 128 || !verifyPassword(password)) {
    sendJson(res, 401, {error: 'Неверный пароль администратора'});
    return;
  }

  sendJson(res, 200, {token: signSessionToken()});
}
