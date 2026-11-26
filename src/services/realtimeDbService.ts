import type {User} from 'firebase/auth';
import {ProductItem, RarityCode, normalizeRarityString} from '../data/products';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  DB_OPERATION_TIMEOUT_MS,
  HARDCODED_DATABASE_URL,
  OperationType,
  SCHEMA_LIMITS,
  handleDatabaseError,
  withTimeout,
} from '../firebase';

export type RtdbHttpMethod = 'GET' | 'PATCH' | 'DELETE';

export interface RtdbDiagnosticEntry {
  id: number;
  timestamp: string;
  action: string;
  method: RtdbHttpMethod;
  url: string;
  authMode: 'public' | 'auth-token';
  status: 'pending' | 'success' | 'error';
  httpStatus?: number;
  durationMs?: number;
  responseBody?: string;
  errorMessage?: string;
}

const MAX_DIAGNOSTIC_ENTRIES = 8;
let nextDiagnosticId = 1;
let diagnosticHistory: RtdbDiagnosticEntry[] = [];
const diagnosticListeners = new Set<(entries: RtdbDiagnosticEntry[]) => void>();

function emitDiagnostics() {
  const snapshot = [...diagnosticHistory];
  for (const listener of diagnosticListeners) {
    listener(snapshot);
  }
}

function addOrUpdateDiagnostic(entry: RtdbDiagnosticEntry) {
  const idx = diagnosticHistory.findIndex((item) => item.id === entry.id);
  if (idx === -1) {
    diagnosticHistory = [entry, ...diagnosticHistory].slice(0, MAX_DIAGNOSTIC_ENTRIES);
  } else {
    diagnosticHistory = diagnosticHistory.map((item) => (item.id === entry.id ? entry : item));
  }
  emitDiagnostics();
}

export function subscribeRtdbDiagnostics(
  listener: (entries: RtdbDiagnosticEntry[]) => void,
): () => void {
  diagnosticListeners.add(listener);
  listener([...diagnosticHistory]);
  return () => {
    diagnosticListeners.delete(listener);
  };
}

export function clearRtdbDiagnostics(): void {
  diagnosticHistory = [];
  emitDiagnostics();
}

function formatNowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString('ru-RU', {hour12: false});
}

function sanitizeResponsePreview(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '(пустой ответ)';
  // Shorten huge inline base64 strings in diagnostics so UI stays fast and readable
  const compacted = trimmed.replace(
    /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]{80,}/g,
    '[base64-image]',
  );
  if (compacted.length > 500) {
    return `${compacted.slice(0, 500)}…`;
  }
  return compacted;
}

interface RestFetchOptions {
  action: string;
  method: RtdbHttpMethod;
  path: string;
  body?: unknown;
  authToken?: string;
  operationType: OperationType;
  timeoutMs?: number;
}

async function rtdbRestFetch<T = unknown>({
  action,
  method,
  path,
  body,
  authToken,
  operationType,
  timeoutMs = DB_OPERATION_TIMEOUT_MS,
}: RestFetchOptions): Promise<{data: T; httpStatus: number; rawText: string}> {
  const normalizedPath = path.replace(/^\/+/, '');
  const cleanUrl = `${HARDCODED_DATABASE_URL}/${normalizedPath}.json`;
  const requestUrl = authToken
    ? `${cleanUrl}?auth=${encodeURIComponent(authToken)}`
    : cleanUrl;

  const entryId = nextDiagnosticId++;
  const startedAt = Date.now();

  addOrUpdateDiagnostic({
    id: entryId,
    timestamp: formatNowTime(),
    action,
    method,
    url: cleanUrl,
    authMode: authToken ? 'auth-token' : 'public',
    status: 'pending',
  });

  const controller = new AbortController();
  const abortTimer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchPromise = fetch(requestUrl, {
      method,
      cache: 'no-store',
      headers: body !== undefined ? {'Content-Type': 'application/json'} : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const response = await withTimeout(
      fetchPromise,
      timeoutMs,
      `Тайм-аут HTTP ${method} (${Math.round(timeoutMs / 1000)} сек): сервер ${cleanUrl} не ответил вовремя.`,
    );

    const rawText = await withTimeout(
      response.text(),
      2500,
      `Тайм-аут чтения ответа от ${cleanUrl}.`,
    );

    const durationMs = Date.now() - startedAt;
    let parsed: unknown = null;
    if (rawText.trim()) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }
    }

    if (!response.ok) {
      const serverError =
        parsed &&
        typeof parsed === 'object' &&
        'error' in parsed &&
        typeof (parsed as {error?: unknown}).error === 'string'
          ? (parsed as {error: string}).error
          : rawText.trim() || response.statusText || 'Unknown error';

      const msg = `HTTP ${response.status}: ${serverError}`;
      addOrUpdateDiagnostic({
        id: entryId,
        timestamp: formatNowTime(),
        action,
        method,
        url: cleanUrl,
        authMode: authToken ? 'auth-token' : 'public',
        status: 'error',
        httpStatus: response.status,
        durationMs,
        responseBody: sanitizeResponsePreview(rawText),
        errorMessage: msg,
      });

      handleDatabaseError(new Error(msg), operationType, normalizedPath);
    }

    addOrUpdateDiagnostic({
      id: entryId,
      timestamp: formatNowTime(),
      action,
      method,
      url: cleanUrl,
      authMode: authToken ? 'auth-token' : 'public',
      status: 'success',
      httpStatus: response.status,
      durationMs,
      responseBody: sanitizeResponsePreview(rawText),
    });

    return {
      data: parsed as T,
      httpStatus: response.status,
      rawText,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const isAbort =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'));
    const rawMsg = isAbort
      ? `Тайм-аут HTTP ${method} (${Math.round(timeoutMs / 1000)} сек): нет ответа от ${cleanUrl}`
      : error instanceof Error
        ? error.message
        : String(error);

    // Avoid overwriting detailed error diagnostic already recorded for !response.ok
    const current = diagnosticHistory.find((item) => item.id === entryId);
    if (!current || current.status === 'pending') {
      addOrUpdateDiagnostic({
        id: entryId,
        timestamp: formatNowTime(),
        action,
        method,
        url: cleanUrl,
        authMode: authToken ? 'auth-token' : 'public',
        status: 'error',
        durationMs,
        errorMessage: rawMsg,
      });
    }

    if (rawMsg.startsWith('{') && rawMsg.includes('"operationType"')) {
      throw error;
    }
    handleDatabaseError(new Error(rawMsg), operationType, normalizedPath);
  } finally {
    globalThis.clearTimeout(abortTimer);
  }
}

export async function getAdminIdToken(user: User): Promise<string> {
  try {
    const tokenResult = await withTimeout(user.getIdTokenResult(false), 2000);
    if (tokenResult.claims?.email_verified === true && tokenResult.token) {
      return tokenResult.token;
    }
  } catch {
    // Fall through to forced refresh
  }

  return await withTimeout(
    user.getIdToken(true),
    3000,
    'Не удалось получить токен авторизации Firebase Auth за 3 сек.',
  );
}

function sanitizeRarity(rarity: string | undefined): RarityCode {
  const normalized = normalizeRarityString(rarity);
  if (SCHEMA_LIMITS.RARITY_PATTERN.test(normalized)) {
    return normalized;
  }
  return '';
}

function sanitizeImageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.length > SCHEMA_LIMITS.PRODUCT_IMAGE_MAX_LENGTH) {
    throw new Error('Размер изображения превышает допустимый лимит базы данных (900 КБ)');
  }
  if (
    /^https?:\/\/.+/.test(trimmed) ||
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
  ) {
    return trimmed;
  }
  throw new Error('Недопустимая ссылка или формат изображения');
}

function sanitizeProductFields(input: Omit<ProductItem, 'id' | 'dbKey'>): Omit<ProductItem, 'id' | 'dbKey'> {
  const name = input.name.trim().slice(0, SCHEMA_LIMITS.PRODUCT_NAME_MAX_LENGTH);
  const price = Math.min(
    SCHEMA_LIMITS.MAX_PRICE,
    Math.max(0, Math.round(Number(input.price) * 100) / 100),
  );
  const gemValue = Math.min(
    SCHEMA_LIMITS.MAX_GEM_VALUE,
    Math.max(0, Math.round(Number(input.gemValue) * 100) / 100),
  );
  if (!Number.isFinite(price) || !Number.isFinite(gemValue)) {
    throw new Error('Укажите корректную цену и количество гемов');
  }
  const imageUrl = sanitizeImageUrl(input.imageUrl);
  const rarity = sanitizeRarity(input.rarity);

  return {name, price, gemValue, imageUrl, rarity};
}

function parseProductsPayload(raw: unknown): ProductItem[] {
  const items: ProductItem[] = [];
  if (!raw || typeof raw !== 'object') {
    return items;
  }

  let fallbackNumericId = 1;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const d = value as Record<string, unknown>;
    if (typeof d.visibility === 'string' && d.visibility !== 'public') continue;

    const rawId =
      typeof d.productId === 'number' && Number.isFinite(d.productId)
        ? d.productId
        : Number(key);
    const id =
      Number.isFinite(rawId) && rawId > 0 ? Math.floor(rawId) : fallbackNumericId++;

    items.push({
      id,
      dbKey: key,
      name: typeof d.name === 'string' ? d.name : '',
      price: typeof d.price === 'number' ? d.price : Number(d.price) || 0,
      gemValue: typeof d.gemValue === 'number' ? d.gemValue : Number(d.gemValue) || 0,
      imageUrl: typeof d.imageUrl === 'string' ? d.imageUrl : '',
      rarity: sanitizeRarity(typeof d.rarity === 'string' ? d.rarity : ''),
    });
  }

  items.sort((a, b) => a.id - b.id);
  return items;
}

export async function checkIsRealtimeAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if ((user.email ?? '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  try {
    const token = await getAdminIdToken(user);
    const {data} = await rtdbRestFetch<unknown>({
      action: 'Проверка прав администратора',
      method: 'GET',
      path: `admins/${user.uid}`,
      authToken: token,
      operationType: OperationType.GET,
    });
    return data !== null && data !== undefined;
  } catch {
    return false;
  }
}

export async function fetchPublicProducts(): Promise<ProductItem[]> {
  const {data} = await rtdbRestFetch<unknown>({
    action: 'Чтение каталога товаров',
    method: 'GET',
    path: 'products',
    operationType: OperationType.LIST,
  });
  return parseProductsPayload(data);
}

const catalogSubscribers = new Set<{
  onData: (products: ProductItem[]) => void;
  onError?: (err: Error) => void;
}>();

export async function refreshCatalogFromRtdb(): Promise<ProductItem[]> {
  try {
    const items = await fetchPublicProducts();
    for (const sub of catalogSubscribers) {
      sub.onData(items);
    }
    return items;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    for (const sub of catalogSubscribers) {
      sub.onError?.(err);
    }
    throw err;
  }
}

export function subscribePublicProducts(
  onData: (products: ProductItem[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const subscriber = {onData, onError};
  catalogSubscribers.add(subscriber);

  void refreshCatalogFromRtdb().catch(() => undefined);

  const pollTimer = globalThis.setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    void refreshCatalogFromRtdb().catch(() => undefined);
  }, 12000);

  return () => {
    catalogSubscribers.delete(subscriber);
    globalThis.clearInterval(pollTimer);
  };
}

let activeSeedPromise: Promise<boolean> | null = null;

export async function seedProductsIfEmpty(
  user: User,
  seedItems: ProductItem[],
): Promise<boolean> {
  if (activeSeedPromise) {
    return activeSeedPromise;
  }

  activeSeedPromise = (async () => {
    const path = 'products';
    const {data: existingRaw} = await rtdbRestFetch<unknown>({
      action: 'Проверка пустой базы перед инициализацией',
      method: 'GET',
      path,
      operationType: OperationType.GET,
    });

    const existingItems = parseProductsPayload(existingRaw);
    if (existingItems.length > 0 || seedItems.length === 0) {
      return false;
    }

    const updates: Record<string, unknown> = {};
    for (const item of seedItems) {
      const clean = sanitizeProductFields(item);
      const id = Math.floor(item.id);
      if (id <= 0 || !SCHEMA_LIMITS.ID_PATTERN.test(String(id))) continue;

      updates[String(id)] = {
        productId: id,
        name: clean.name,
        price: clean.price,
        gemValue: clean.gemValue,
        imageUrl: clean.imageUrl,
        rarity: clean.rarity,
        visibility: 'public',
        createdBy: user.uid,
        createdAt: {'.sv': 'timestamp'},
        updatedAt: {'.sv': 'timestamp'},
      };
    }

    if (Object.keys(updates).length === 0) {
      return false;
    }

    const token = await getAdminIdToken(user);
    await rtdbRestFetch({
      action: 'Начальное заполнение каталога',
      method: 'PATCH',
      path,
      body: updates,
      authToken: token,
      operationType: OperationType.WRITE,
    });

    void refreshCatalogFromRtdb().catch(() => undefined);
    return true;
  })();

  try {
    return await activeSeedPromise;
  } finally {
    activeSeedPromise = null;
  }
}

export async function createProductInRtdb(
  user: User,
  currentProducts: ProductItem[],
  payload: Omit<ProductItem, 'id' | 'dbKey'>,
): Promise<ProductItem> {
  const clean = sanitizeProductFields(payload);
  let nextId =
    currentProducts.reduce((maxId, item) => (item.id > maxId ? item.id : maxId), 0) + 1;

  try {
    const existing = await fetchPublicProducts();
    for (const item of existing) {
      if (item.id >= nextId) {
        nextId = item.id + 1;
      }
      const keyNum = item.dbKey ? Number(item.dbKey) : NaN;
      if (Number.isFinite(keyNum) && keyNum >= nextId) {
        nextId = Math.floor(keyNum) + 1;
      }
    }
  } catch {
    // Fall back to local maxId + 1 if pre-read fails
  }

  const token = await getAdminIdToken(user);
  const newKey = String(nextId);

  await rtdbRestFetch({
    action: `Добавление товара #${nextId}`,
    method: 'PATCH',
    path: 'products',
    body: {
      [newKey]: {
        productId: nextId,
        name: clean.name,
        price: clean.price,
        gemValue: clean.gemValue,
        imageUrl: clean.imageUrl,
        rarity: clean.rarity,
        visibility: 'public',
        createdBy: user.uid,
        createdAt: {'.sv': 'timestamp'},
        updatedAt: {'.sv': 'timestamp'},
      },
    },
    authToken: token,
    operationType: OperationType.CREATE,
  });

  await refreshCatalogFromRtdb().catch(() => undefined);
  return {id: nextId, dbKey: newKey, ...clean};
}

export async function updateProductInRtdb(
  user: User,
  id: number,
  payload: Omit<ProductItem, 'id' | 'dbKey'>,
  dbKey?: string,
): Promise<ProductItem> {
  const clean = sanitizeProductFields(payload);
  const productId = Math.floor(id);
  const targetKey = dbKey && dbKey.trim() ? dbKey.trim() : String(productId);
  const path = `products/${targetKey}`;

  let existingVal: Record<string, unknown> | null = null;
  try {
    const {data} = await rtdbRestFetch<unknown>({
      action: `Проверка товара #${productId} перед изменением`,
      method: 'GET',
      path,
      operationType: OperationType.GET,
      timeoutMs: 3000,
    });
    if (data && typeof data === 'object') {
      existingVal = data as Record<string, unknown>;
    }
  } catch {
    // Proceed directly with PATCH so edit attempt still surfaces exact write response
  }

  const token = await getAdminIdToken(user);
  await rtdbRestFetch({
    action: `Сохранение товара #${productId}`,
    method: 'PATCH',
    path,
    body: {
      productId,
      name: clean.name,
      price: clean.price,
      gemValue: clean.gemValue,
      imageUrl: clean.imageUrl,
      rarity: clean.rarity,
      visibility: 'public',
      createdBy:
        existingVal && typeof existingVal.createdBy === 'string'
          ? existingVal.createdBy
          : user.uid,
      createdAt: existingVal?.createdAt ?? {'.sv': 'timestamp'},
      updatedAt: {'.sv': 'timestamp'},
    },
    authToken: token,
    operationType: OperationType.UPDATE,
  });

  await refreshCatalogFromRtdb().catch(() => undefined);
  return {id: productId, dbKey: targetKey, ...clean};
}

export async function deleteProductFromRtdb(
  user: User,
  id: number,
  dbKey?: string,
): Promise<void> {
  const productId = Math.floor(id);
  const targetKey = dbKey && dbKey.trim() ? dbKey.trim() : String(productId);
  const path = `products/${targetKey}`;
  const token = await getAdminIdToken(user);

  await rtdbRestFetch({
    action: `Удаление товара #${productId}`,
    method: 'DELETE',
    path,
    authToken: token,
    operationType: OperationType.DELETE,
  });

  await refreshCatalogFromRtdb().catch(() => undefined);
}
