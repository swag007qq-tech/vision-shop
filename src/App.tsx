/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  type User,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {AdminModal} from './components/AdminModal';
import {BackgroundScene} from './components/BackgroundScene';
import {BottomDock} from './components/BottomDock';
import {ActiveTab, HeaderBar} from './components/HeaderBar';
import {IntroSplash} from './components/IntroSplash';
import {ProductGrid} from './components/ProductGrid';
import {ReviewsBlock} from './components/ReviewsBlock';
import {CartDrawer, CartEntry, FavoritesDrawer} from './components/ShopDrawers';
import {DEFAULT_PRODUCTS, ProductItem} from './data/products';
import {ADMIN_LOGIN_EMAIL, auth} from './firebase';
import {
  checkIsFirestoreAdmin,
  ensureUserAccount,
  seedProductsIfEmpty,
  setCartQtyInFirestore,
  setFavoriteInFirestore,
  subscribePublicProducts,
  subscribeUserCart,
  subscribeUserFavorites,
} from './services/firestoreService';

const FAVORITES_STORAGE_KEY = 'vision_shop_favorites_v1';
const CART_STORAGE_KEY = 'vision_shop_cart_v1';

function loadSavedFavorites(): number[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is number => typeof id === 'number');
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

function loadSavedCart(): Record<number, number> {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const cleaned: Record<number, number> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const id = Number(k);
        if (Number.isFinite(id) && typeof v === 'number' && v > 0) {
          cleaned[id] = Math.floor(v);
        }
      }
      return cleaned;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [introFinished, setIntroFinished] = useState(false);

  const [firestoreProducts, setFirestoreProducts] = useState<ProductItem[]>([]);
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);
  const [firestoreSeeded, setFirestoreSeeded] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<number[]>(loadSavedFavorites);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>(loadSavedCart);
  const [activeDrawer, setActiveDrawer] = useState<'favorites' | 'cart' | null>(null);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [quickEditId, setQuickEditId] = useState<number | null>(null);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isFirestoreAdmin, setIsFirestoreAdmin] = useState(false);

  // Track Firebase Authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user && user.emailVerified) {
        try {
          await ensureUserAccount(user);
          const adminStatus = await checkIsFirestoreAdmin(user);
          setIsFirestoreAdmin(adminStatus);
        } catch (err) {
          console.error('Auth initialization error:', err);
          setIsFirestoreAdmin(false);
        }
      } else {
        setIsFirestoreAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to public Firestore product catalog in real time (serverless, works on Vercel)
  useEffect(() => {
    const unsub = subscribePublicProducts(
      (items) => {
        setFirestoreProducts(items);
        setFirestoreLoaded(true);
        if (items.length > 0) {
          setFirestoreSeeded(true);
        }
      },
      (error) => {
        console.warn('Firestore catalog listener fallback:', error.message);
        setFirestoreLoaded(true);
      },
    );
    return () => unsub();
  }, []);

  // Auto-seed Firestore catalog on first admin sign-in when database is empty
  useEffect(() => {
    if (!authReady || !isFirestoreAdmin || !authUser || !firestoreLoaded) return;
    if (firestoreProducts.length === 0 && !firestoreSeeded) {
      void seedProductsIfEmpty(authUser, DEFAULT_PRODUCTS).then((seeded) => {
        if (seeded) {
          setFirestoreSeeded(true);
        }
      });
    }
  }, [
    authReady,
    isFirestoreAdmin,
    authUser,
    firestoreLoaded,
    firestoreProducts.length,
    firestoreSeeded,
  ]);

  // Attach user-specific favorites and cart listeners ONLY when auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified) return;

    let initialFavSync = true;
    let initialCartSync = true;

    const unsubFav = subscribeUserFavorites(authUser.uid, (cloudIds) => {
      if (initialFavSync) {
        initialFavSync = false;
        if (cloudIds.length === 0) {
          setFavoriteIds((prev) => prev);
          return;
        }
      }
      setFavoriteIds(cloudIds);
    });

    const unsubCart = subscribeUserCart(authUser.uid, (cloudCart) => {
      if (initialCartSync) {
        initialCartSync = false;
        if (Object.keys(cloudCart).length === 0) {
          setCartQuantities((prev) => prev);
          return;
        }
      }
      setCartQuantities(cloudCart);
    });

    return () => {
      unsubFav();
      unsubCart();
    };
  }, [authReady, authUser]);

  const products = useMemo(() => {
    if (firestoreProducts.length > 0 || firestoreSeeded) {
      return firestoreProducts;
    }
    return DEFAULT_PRODUCTS;
  }, [firestoreProducts, firestoreSeeded]);

  const firestoreProductIds = useMemo(
    () => new Set(firestoreProducts.map((p) => p.id)),
    [firestoreProducts],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore storage errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartQuantities));
    } catch {
      // ignore storage errors
    }
  }, [cartQuantities]);

  const handlePasswordSignIn = useCallback(async (password: string) => {
    const credential = await signInWithEmailAndPassword(auth, ADMIN_LOGIN_EMAIL, password);
    await credential.user.reload();

    if (!credential.user.emailVerified) {
      try {
        await sendEmailVerification(credential.user);
      } catch {
        // Ignore rate-limit errors if verification email was recently sent
      }
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    await ensureUserAccount(credential.user);
    const adminStatus = await checkIsFirestoreAdmin(credential.user);
    setAuthUser(credential.user);
    setIsFirestoreAdmin(adminStatus);
    if (!adminStatus) {
      throw new Error('NOT_ADMIN_ACCOUNT');
    }
  }, []);

  const handleAdminSignOut = useCallback(async () => {
    await signOut(auth);
    setIsFirestoreAdmin(false);
  }, []);

  const handleSeedFirestore = useCallback(async () => {
    if (!authUser || !isFirestoreAdmin) return;
    await seedProductsIfEmpty(authUser, DEFAULT_PRODUCTS);
    setFirestoreSeeded(true);
  }, [authUser, isFirestoreAdmin]);

  const handleToggleFavorite = (id: number) => {
    const willBeFavorite = !favoriteIds.includes(id);
    setFavoriteIds((prev) =>
      willBeFavorite ? [...prev, id] : prev.filter((itemId) => itemId !== id),
    );

    if (authUser && authUser.emailVerified && firestoreProductIds.has(id)) {
      void setFavoriteInFirestore(authUser.uid, id, willBeFavorite).catch((err) => {
        console.error('Failed to sync favorite to Firestore:', err);
      });
    }
  };

  const handleAddToCart = (product: ProductItem) => {
    const nextQty = (cartQuantities[product.id] ?? 0) + 1;
    setCartQuantities((prev) => ({
      ...prev,
      [product.id]: nextQty,
    }));

    if (authUser && authUser.emailVerified && firestoreProductIds.has(product.id)) {
      void setCartQtyInFirestore(authUser.uid, product.id, nextQty).catch((err) => {
        console.error('Failed to sync cart item to Firestore:', err);
      });
    }
  };

  const handleUpdateCartQty = (id: number, delta: number) => {
    const nextQty = (cartQuantities[id] ?? 0) + delta;
    setCartQuantities((prev) => {
      if (nextQty <= 0) {
        const copy = {...prev};
        delete copy[id];
        return copy;
      }
      return {...prev, [id]: nextQty};
    });

    if (authUser && authUser.emailVerified && firestoreProductIds.has(id)) {
      void setCartQtyInFirestore(authUser.uid, id, nextQty).catch((err) => {
        console.error('Failed to update cart item in Firestore:', err);
      });
    }
  };

  const handleRemoveCartItem = (id: number) => {
    setCartQuantities((prev) => {
      const copy = {...prev};
      delete copy[id];
      return copy;
    });

    if (authUser && authUser.emailVerified && firestoreProductIds.has(id)) {
      void setCartQtyInFirestore(authUser.uid, id, 0).catch((err) => {
        console.error('Failed to remove cart item in Firestore:', err);
      });
    }
  };

  const favoriteItems = useMemo(
    () => products.filter((product) => favoriteIds.includes(product.id)),
    [products, favoriteIds],
  );

  const cartEntries: CartEntry[] = useMemo(
    () =>
      products
        .filter((product) => (cartQuantities[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: cartQuantities[product.id],
        })),
    [products, cartQuantities],
  );

  const totalCartCount = useMemo(
    () => cartEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    [cartEntries],
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between bg-white text-[#141414]">
      {!introFinished && <IntroSplash onDone={() => setIntroFinished(true)} />}

      <BackgroundScene />

      <div className="relative z-10 flex flex-col flex-1 justify-between w-full">
        <HeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={isFirestoreAdmin}
          onOpenAdmin={() => {
            setQuickEditId(null);
            setAdminModalOpen(true);
          }}
        />

        <main className="w-full flex-1 flex flex-col justify-center">
          {activeTab === 'catalog' ? (
            <ProductGrid
              products={products}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleAddToCart}
              isAdmin={isFirestoreAdmin}
              onQuickEdit={(id) => {
                setQuickEditId(id);
                setAdminModalOpen(true);
              }}
            />
          ) : (
            <ReviewsBlock />
          )}
        </main>

        <BottomDock
          favoritesCount={favoriteItems.length}
          cartCount={totalCartCount}
          onOpenFavorites={() => setActiveDrawer('favorites')}
          onOpenCart={() => setActiveDrawer('cart')}
        />
      </div>

      <FavoritesDrawer
        open={activeDrawer === 'favorites'}
        onClose={() => setActiveDrawer(null)}
        items={favoriteItems}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={activeDrawer === 'cart'}
        onClose={() => setActiveDrawer(null)}
        entries={cartEntries}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
      />

      <AdminModal
        open={adminModalOpen}
        onClose={() => {
          setAdminModalOpen(false);
          setQuickEditId(null);
        }}
        authUser={authUser}
        isFirestoreAdmin={isFirestoreAdmin}
        onPasswordSignIn={handlePasswordSignIn}
        onLogout={() => {
          void handleAdminSignOut();
        }}
        firestoreProductIds={firestoreProductIds}
        onSeedFirestore={handleSeedFirestore}
        products={products}
        initialEditProductId={quickEditId}
      />
    </div>
  );
}
