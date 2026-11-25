import type {User} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {ProductItem, RarityCode} from '../data/products';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  SCHEMA_LIMITS,
  db,
  handleFirestoreError,
} from '../firebase';

export interface AdminRecord {
  uid: string;
  email: string;
}

function sanitizeRarity(rarity: string | undefined): RarityCode {
  if (rarity && SCHEMA_LIMITS.RARITY_PATTERN.test(rarity)) {
    return rarity as RarityCode;
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

export async function checkIsFirestoreAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;

  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      return false;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAdmins(
  onData: (admins: AdminRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'admins';
  const q = query(collection(db, path), where('role', '==', 'admin'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AdminRecord[] = [];
      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();
        if (typeof d.uid === 'string' && typeof d.email === 'string') {
          list.push({uid: d.uid, email: d.email});
        }
      }
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function addAdminInFirestore(
  owner: User,
  targetUid: string,
  targetEmail: string,
): Promise<void> {
  const uid = targetUid.trim();
  const email = targetEmail.trim();
  if (!SCHEMA_LIMITS.ID_PATTERN.test(uid) || uid.length > 128) {
    throw new Error('Некорректный UID пользователя');
  }
  if (email.length < 4 || email.length > 254 || !email.includes('@')) {
    throw new Error('Укажите корректный email администратора');
  }
  const path = `admins/${uid}`;
  try {
    await setDoc(doc(db, 'admins', uid), {
      uid,
      email,
      role: 'admin',
      addedBy: owner.uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeAdminInFirestore(targetUid: string): Promise<void> {
  const uid = targetUid.trim();
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublicProducts(
  onData: (products: ProductItem[], fromServer: boolean) => void,
  onError?: (err: Error) => void,
): () => void {
  const path = 'products';
  const q = query(collection(db, path), where('visibility', '==', 'public'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ProductItem[] = [];
      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();
        const productId = typeof d.productId === 'number' ? d.productId : Number(docSnap.id);
        if (!Number.isFinite(productId) || productId <= 0) continue;
        items.push({
          id: Math.floor(productId),
          name: typeof d.name === 'string' ? d.name : '',
          price: typeof d.price === 'number' ? d.price : 0,
          gemValue: typeof d.gemValue === 'number' ? d.gemValue : 0,
          imageUrl: typeof d.imageUrl === 'string' ? d.imageUrl : '',
          rarity: sanitizeRarity(typeof d.rarity === 'string' ? d.rarity : ''),
        });
      }
      items.sort((a, b) => a.id - b.id);
      onData(items, !snapshot.metadata.fromCache);
    },
    (error) => {
      if (onError) {
        onError(error);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function seedProductsIfEmpty(
  user: User,
  seedItems: ProductItem[],
): Promise<boolean> {
  const path = 'products';
  const q = query(collection(db, path), where('visibility', '==', 'public'));
  try {
    const existingSnap = await getDocs(q);
    if (!existingSnap.empty || seedItems.length === 0) {
      return false;
    }

    const batch = writeBatch(db);
    for (const item of seedItems) {
      const clean = sanitizeProductFields(item);
      const id = Math.floor(item.id);
      if (id <= 0 || !SCHEMA_LIMITS.ID_PATTERN.test(String(id))) continue;

      batch.set(doc(db, 'products', String(id)), {
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
      });
    }
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createProductInFirestore(
  user: User,
  currentProducts: ProductItem[],
  payload: Omit<ProductItem, 'id'>,
): Promise<ProductItem> {
  const clean = sanitizeProductFields(payload);
  const nextId =
    currentProducts.reduce((maxId, item) => (item.id > maxId ? item.id : maxId), 0) + 1;
  const docId = String(nextId);
  const path = `products/${docId}`;

  try {
    await setDoc(doc(db, 'products', docId), {
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
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProductInFirestore(
  id: number,
  payload: Omit<ProductItem, 'id'>,
): Promise<ProductItem> {
  const clean = sanitizeProductFields(payload);
  const productId = Math.floor(id);
  const docId = String(productId);
  const path = `products/${docId}`;

  try {
    await updateDoc(doc(db, 'products', docId), {
      productId,
      name: clean.name,
      price: clean.price,
      gemValue: clean.gemValue,
      imageUrl: clean.imageUrl,
      rarity: clean.rarity,
      visibility: 'public',
      updatedAt: serverTimestamp(),
    });
    return {id: productId, ...clean};
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductFromFirestore(id: number): Promise<void> {
  const docId = String(Math.floor(id));
  const path = `products/${docId}`;
  try {
    await deleteDoc(doc(db, 'products', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function ensureUserAccount(user: User): Promise<void> {
  if (!user.emailVerified) return;

  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  const profilePath = `users/${user.uid}/private/profile`;
  try {
    const profileRef = doc(db, 'users', user.uid, 'private', 'profile');
    const profileSnap = await getDoc(profileRef);
    const email = (user.email ?? '').slice(0, 254);
    const displayName = (user.displayName ?? '').slice(0, 120);

    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        uid: user.uid,
        email,
        displayName,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(profileRef, {
        email,
        displayName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

export function subscribeUserFavorites(
  userId: string,
  onData: (ids: number[]) => void,
): () => void {
  const path = `users/${userId}/favorites`;
  const q = query(collection(db, 'users', userId, 'favorites'), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const ids: number[] = [];
      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();
        const pid = typeof d.productId === 'number' ? d.productId : Number(docSnap.id);
        if (Number.isFinite(pid) && pid > 0) {
          ids.push(Math.floor(pid));
        }
      }
      ids.sort((a, b) => a - b);
      onData(ids);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeUserCart(
  userId: string,
  onData: (quantities: Record<number, number>) => void,
): () => void {
  const path = `users/${userId}/cart`;
  const q = query(collection(db, 'users', userId, 'cart'), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const quantities: Record<number, number> = {};
      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();
        const pid = typeof d.productId === 'number' ? d.productId : Number(docSnap.id);
        const qty = typeof d.quantity === 'number' ? Math.floor(d.quantity) : 0;
        if (Number.isFinite(pid) && pid > 0 && qty > 0) {
          quantities[Math.floor(pid)] = Math.min(SCHEMA_LIMITS.MAX_CART_QUANTITY, qty);
        }
      }
      onData(quantities);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function setFavoriteInFirestore(
  userId: string,
  productId: number,
  isFavorite: boolean,
): Promise<void> {
  const pid = Math.floor(productId);
  const docId = String(pid);
  const path = `users/${userId}/favorites/${docId}`;
  const ref = doc(db, 'users', userId, 'favorites', docId);

  try {
    if (isFavorite) {
      await setDoc(ref, {
        productId: pid,
        ownerId: userId,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(ref);
    }
  } catch (error) {
    handleFirestoreError(error, isFavorite ? OperationType.CREATE : OperationType.DELETE, path);
  }
}

export async function setCartQtyInFirestore(
  userId: string,
  productId: number,
  quantity: number,
): Promise<void> {
  const pid = Math.floor(productId);
  const docId = String(pid);
  const path = `users/${userId}/cart/${docId}`;
  const ref = doc(db, 'users', userId, 'cart', docId);

  try {
    if (quantity <= 0) {
      await deleteDoc(ref);
      return;
    }

    const clampedQty = Math.min(SCHEMA_LIMITS.MAX_CART_QUANTITY, Math.max(1, Math.floor(quantity)));
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        productId: pid,
        ownerId: userId,
        quantity: clampedQty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        quantity: clampedQty,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
