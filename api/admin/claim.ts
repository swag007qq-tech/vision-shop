import type {IncomingMessage, ServerResponse} from 'node:http';
import {
  getClientIp,
  isAdminConfigured,
  isRateLimited,
  readJsonBody,
  sendJson,
  signSessionToken,
  writeClaimedAdmin,
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

  if (isAdminConfigured()) {
    sendJson(res, 409, {error: 'Пароль администратора уже настроен'});
    return;
  }

  const body = await readJsonBody(req);
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if (password.length < 6 || password.length > 128) {
    sendJson(res, 400, {error: 'Пароль должен содержать от 6 до 128 символов'});
    return;
  }

  if (!writeClaimedAdmin(password)) {
    sendJson(res, 409, {error: 'Пароль администратора уже настроен'});
    return;
  }

  sendJson(res, 200, {token: signSessionToken()});
}
