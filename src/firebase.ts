import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {doc, getDocFromServer, getFirestore} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const customProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
const isCustomProject = Boolean(customProjectId) && customProjectId !== firebaseConfig.projectId;
const customDatabaseId = (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '').trim();

const resolvedDatabaseId =
  customDatabaseId || (isCustomProject ? '(default)' : firebaseConfig.firestoreDatabaseId);

const app = initializeApp(resolvedConfig);

// CRITICAL: Pass firestoreDatabaseId when configured
export const db =
  resolvedDatabaseId && resolvedDatabaseId !== '(default)'
    ? getFirestore(app, resolvedDatabaseId)
    : getFirestore(app);

export const auth = getAuth(app);

export const FIREBASE_TARGET_INFO = {
  projectId: resolvedConfig.projectId,
  databaseId: resolvedDatabaseId || '(default)',
};

export const BOOTSTRAPPED_ADMIN_EMAIL = 'swag007qq@gmail.com';
export const ADMIN_LOGIN_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL || '').trim() || BOOTSTRAPPED_ADMIN_EMAIL;

// Schema limits synchronized verbatim with firebase-blueprint.json & firestore.rules
export const SCHEMA_LIMITS = {
  PRODUCT_NAME_MAX_LENGTH: 80,
  PRODUCT_IMAGE_MAX_LENGTH: 900000,
  MAX_PRICE: 1000000,
  MAX_GEM_VALUE: 1000000,
  MAX_CART_QUANTITY: 999,
  RARITY_PATTERN: /^(|N|M|R|F)$/,
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

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: Array<{
      providerId?: string | null;
      email?: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
