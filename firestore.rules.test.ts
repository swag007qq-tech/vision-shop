/**
 * Payload-First Security Rule Verification Spec for Vision shop.
 * Covers the Dirty Dozen adversarial payloads against DRAFT_firestore.rules / firestore.rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {uid?: string; email?: string; email_verified?: boolean} | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated product create',
    path: 'products/99',
    operation: 'create',
    auth: null,
    payload: {productId: 99, name: 'Test', price: 10, gemValue: 1, imageUrl: '', rarity: '', visibility: 'public'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-admin verified user product create',
    path: 'products/99',
    operation: 'create',
    auth: {uid: 'user-1', email: 'shopper@example.com', email_verified: true},
    payload: {productId: 99, name: 'Test', price: 10, gemValue: 1, imageUrl: '', rarity: '', visibility: 'public'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow field injection on product update',
    path: 'products/1',
    operation: 'update',
    auth: {uid: 'admin-1', email: 'swag007qq@gmail.com', email_verified: true},
    payload: {isFeatured: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Invalid rarity enum code',
    path: 'products/10',
    operation: 'create',
    auth: {uid: 'admin-1', email: 'swag007qq@gmail.com', email_verified: true},
    payload: {rarity: 'SSS'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized document ID poisoning',
    path: `products/${'a'.repeat(200)}`,
    operation: 'create',
    auth: {uid: 'admin-1', email: 'swag007qq@gmail.com', email_verified: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unverified admin email spoofing',
    path: 'products/11',
    operation: 'create',
    auth: {uid: 'spoof-1', email: 'swag007qq@gmail.com', email_verified: false},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Self-assigned admin role escalation',
    path: 'admins/user-1',
    operation: 'create',
    auth: {uid: 'user-1', email: 'shopper@example.com', email_verified: true},
    payload: {uid: 'user-1', email: 'shopper@example.com', role: 'admin'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Cross-user PII profile read',
    path: 'users/user-2/private/profile',
    operation: 'get',
    auth: {uid: 'user-1', email: 'shopper@example.com', email_verified: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Cross-user favorites list query',
    path: 'users/user-2/favorites',
    operation: 'list',
    auth: {uid: 'user-1', email: 'shopper@example.com', email_verified: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned favorite referencing nonexistent product',
    path: 'users/user-1/favorites/99999',
    operation: 'create',
    auth: {uid: 'user-1', email: 'shopper@example.com', email_verified: true},
    payload: {productId: 99999, ownerId: 'user-1'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Backdated client timestamp',
    path: 'products/12',
    operation: 'create',
    auth: {uid: 'admin-1', email: 'swag007qq@gmail.com', email_verified: true},
    payload: {createdAt: '2020-01-01T00:00:00Z'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Out-of-bounds cart quantity',
    path: 'users/user-1/cart/1',
    operation: 'create',
    auth: {uid: 'user-1', email: 'shopper@example.com', email_verified: true},
    payload: {productId: 1, ownerId: 'user-1', quantity: 5000},
    expected: 'PERMISSION_DENIED',
  },
];
