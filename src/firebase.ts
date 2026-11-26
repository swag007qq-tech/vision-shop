import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {get, getDatabase, ref} from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

const DEFAULT_RTDB_INSTANCE = 'my-shop-f8944-default-rtdb';

const resolvedProjectId = (
  import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId
).trim();
const rawAuthDomain = (
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain
).trim();
const resolvedAuthDomain =
  rawAuthDomain && !rawAuthDomain.startsWith('://') && rawAuthDomain.includes('.')
    ? rawAuthDomain
    : `${resolvedProjectId}.firebaseapp.com`;

const customRtdbUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL || '').trim();
const resolvedDatabaseUrl =
  customRtdbUrl && customRtdbUrl !== 'https://firebaseio.com'
    ? customRtdbUrl
    : `https://${DEFAULT_RTDB_INSTANCE}.firebaseio.com`;

const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: resolvedAuthDomain,
  projectId: resolvedProjectId,
  databaseURL: resolvedDatabaseUrl,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(resolvedConfig);

export const rtdb = getDatabase(app, resolvedDatabaseUrl);
export const auth = getAuth(app);

export const FIREBASE_TARGET_INFO = {
  projectId: resolvedConfig.projectId,
  databaseId: DEFAULT_RTDB_INSTANCE,
  databaseUrl: resolvedDatabaseUrl,
};

export const BOOTSTRAPPED_ADMIN_EMAIL = 'swag007qq@gmail.com';
export const ADMIN_LOGIN_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL || '').trim() || BOOTSTRAPPED_ADMIN_EMAIL;

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleDatabaseError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const firebaseCode =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';
  const rawMessage = error instanceof Error ? error.message : String(error);
  const formattedError =
    firebaseCode && !rawMessage.includes(firebaseCode)
      ? `[${firebaseCode}] ${rawMessage}`
      : rawMessage;

  const errInfo: DatabaseErrorInfo = {
    error: formattedError,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Realtime Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await get(ref(rtdb, 'products'));
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('network')) {
      console.warn('Realtime Database network check warning:', error.message);
    }
  }
}

void testConnection();
