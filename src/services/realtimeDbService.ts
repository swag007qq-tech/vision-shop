import type {User} from 'firebase/auth';
import {
  get,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import {ProductItem, RarityCode, normalizeRarityString} from '../data/products';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  SCHEMA_LIMITS,
  handleDatabaseError,
  rtdb,
} from '../firebase';

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

function sanitizeProductFields(input: Omit<ProductItem, 'id'>): Omit<ProductItem, 'id'> {
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

export async function checkIsRealtimeAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if ((user.email ?? '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  const path = `admins/${user.uid}`;
  try {
    const snap = await get(ref(rtdb, path));
    return snap.exists();
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      return false;
    }
    handleDatabaseError(error, OperationType.GET, path);
  }
}

export function subscribePublicProducts(
  onData: (products: ProductItem[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'products';
  const productsRef = ref(rtdb, path);

  return onValue(
    productsRef,
    (snapshot) => {
      const raw = snapshot.val() as unknown;
      const items: ProductItem[] = [];

      if (raw && typeof raw === 'object') {
        const entries = Object.entries(raw as Record<string, unknown>);
        for (const [key, value] of entries) {
          if (!value || typeof value !== 'object') continue;
          const d = value as Record<string, unknown>;
          if (typeof d.visibility === 'string' && d.visibility !== 'public') continue;

          const productId = typeof d.productId === 'number' ? d.productId : Number(key);
          if (!Number.isFinite(productId) || productId <= 0) continue;

          items.push({
            id: Math.floor(productId),
            name: typeof d.name === 'string' ? d.name : '',
            price: typeof d.price === 'number' ? d.price : Number(d.price) || 0,
            gemValue: typeof d.gemValue === 'number' ? d.gemValue : Number(d.gemValue) || 0,
            imageUrl: typeof d.imageUrl === 'string' ? d.imageUrl : '',
            rarity: sanitizeRarity(typeof d.rarity === 'string' ? d.rarity : ''),
          });
        }
      }

      items.sort((a, b) => a.id - b.id);
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
        return;
      }
      handleDatabaseError(error, OperationType.LIST, path);
    },
  );
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
    const productsRef = ref(rtdb, path);
    try {
      const existingSnap = await get(productsRef);
      if (existingSnap.exists() || seedItems.length === 0) {
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      }

      if (Object.keys(updates).length === 0) {
        return false;
      }

      await update(productsRef, updates);
      return true;
    } catch (error) {
      handleDatabaseError(error, OperationType.WRITE, path);
    }
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
  payload: Omit<ProductItem, 'id'>,
): Promise<ProductItem> {
  const clean = sanitizeProductFields(payload);
  let nextId =
    currentProducts.reduce((maxId, item) => (item.id > maxId ? item.id : maxId), 0) + 1;

  while (nextId <= 1000000) {
    try {
      const existing = await get(ref(rtdb, `products/${nextId}`));
      if (!existing.exists()) break;
      nextId += 1;
    } catch {
      break;
    }
  }

  const path = `products/${nextId}`;
  try {
    await set(ref(rtdb, path), {
      productId: nextId,
      name: clean.name,
      price: clean.price,
      gemValue: clean.gemValue,
      imageUrl: clean.imageUrl,
      rarity: clean.rarity,
      visibility: 'public',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {id: nextId, ...clean};
  } catch (error) {
    handleDatabaseError(error, OperationType.CREATE, path);
  }
}

export async function updateProductInRtdb(
  user: User,
  id: number,
  payload: Omit<ProductItem, 'id'>,
): Promise<ProductItem> {
  const clean = sanitizeProductFields(payload);
  const productId = Math.floor(id);
  const path = `products/${productId}`;
  const productRef = ref(rtdb, path);

  try {
    const existingSnap = await get(productRef);
    if (!existingSnap.exists()) {
      await set(productRef, {
        productId,
        name: clean.name,
        price: clean.price,
        gemValue: clean.gemValue,
        imageUrl: clean.imageUrl,
        rarity: clean.rarity,
        visibility: 'public',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await update(productRef, {
        productId,
        name: clean.name,
        price: clean.price,
        gemValue: clean.gemValue,
        imageUrl: clean.imageUrl,
        rarity: clean.rarity,
        visibility: 'public',
        updatedAt: serverTimestamp(),
      });
    }
    return {id: productId, ...clean};
  } catch (error) {
    handleDatabaseError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductFromRtdb(id: number): Promise<void> {
  const productId = Math.floor(id);
  const path = `products/${productId}`;
  try {
    await remove(ref(rtdb, path));
  } catch (error) {
    handleDatabaseError(error, OperationType.DELETE, path);
  }
}
