const DEFAULT_RTDB_INSTANCE = 'my-shop-f8944-default-rtdb';
const DEFAULT_PROJECT_ID = 'my-shop-f8944';
export const HARDCODED_DATABASE_URL = `https://${DEFAULT_RTDB_INSTANCE}.firebaseio.com`;

export const FIREBASE_TARGET_INFO = {
  projectId: DEFAULT_PROJECT_ID,
  databaseId: DEFAULT_RTDB_INSTANCE,
  databaseUrl: HARDCODED_DATABASE_URL,
};

export const DB_OPERATION_TIMEOUT_MS = 5000;

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DB_OPERATION_TIMEOUT_MS,
  timeoutMessage = `Время ожидания ответа от Realtime Database истекло (${Math.round(
    timeoutMs / 1000,
  )} сек). Проверьте подключение к сети и адрес ${HARDCODED_DATABASE_URL}.`,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const SCHEMA_LIMITS = {
  PRODUCT_NAME_MAX_LENGTH: 80,
  PRODUCT_IMAGE_MAX_LENGTH: 900000,
  MAX_PRICE: 1000000,
  MAX_GEM_VALUE: 1000000,
  MAX_CART_QUANTITY: 999,
  RARITY_PATTERN: /^[NMRF]{0,3}$/,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleDatabaseError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const rawMessage = error instanceof Error ? error.message : String(error);

  const errInfo: DatabaseErrorInfo = {
    error: rawMessage,
    operationType,
    path,
  };
  console.error('Realtime Database REST Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
