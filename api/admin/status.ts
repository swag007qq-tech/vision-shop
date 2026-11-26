import type {IncomingMessage, ServerResponse} from 'node:http';
import {isAdminConfigured, sendJson, verifySessionToken} from './_auth';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== 'GET') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  const authHeader = req.headers.authorization;
  const authenticated =
    Boolean(authHeader && authHeader.startsWith('Bearer ')) &&
    verifySessionToken((authHeader ?? '').slice('Bearer '.length).trim());

  sendJson(res, 200, {
    configured: isAdminConfigured(),
    authenticated,
  });
}
