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
  checkIsRealtimeAdmin,
  seedProductsIfEmpty,
  subscribePublicProducts,
} from './services/realtimeDbService';

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

  const [rtdbProducts, setRtdbProducts] = useState<ProductItem[]>([]);
  const [rtdbLoaded, setRtdbLoaded] = useState(false);
  const [rtdbSeeded, setRtdbSeeded] = useState(false);
  const [rtdbReadError, setRtdbReadError] = useState<string>('');

  const [favoriteIds, setFavoriteIds] = useState<number[]>(loadSavedFavorites);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>(loadSavedCart);
  const [activeDrawer, setActiveDrawer] = useState<'favorites' | 'cart' | null>(null);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [quickEditId, setQuickEditId] = useState<number | null>(null);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isRealtimeAdmin, setIsRealtimeAdmin] = useState(false);

  // Track Firebase Authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          if (!user.emailVerified) {
            await user.reload().catch(() => undefined);
          }
          if (user.emailVerified) {
            await user.getIdToken(true).catch(() => undefined);
            const adminStatus = await checkIsRealtimeAdmin(user);
            setIsRealtimeAdmin(adminStatus);
          } else {
            setIsRealtimeAdmin(false);
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
          setIsRealtimeAdmin(false);
        }
      } else {
        setIsRealtimeAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to public Realtime Database product catalog in real time
  useEffect(() => {
    const unsub = subscribePublicProducts(
      (items) => {
        setRtdbProducts(items);
        setRtdbLoaded(true);
        setRtdbReadError('');
        if (items.length > 0) {
          setRtdbSeeded(true);
        }
      },
      (error) => {
        console.warn('Realtime Database catalog listener fallback:', error.message);
        setRtdbReadError(error.message);
        setRtdbLoaded(true);
      },
    );
    return () => unsub();
  }, []);

  // Auto-seed Realtime Database catalog on first admin sign-in when database is empty
  useEffect(() => {
    if (!authReady || !isRealtimeAdmin || !authUser || !rtdbLoaded) return;
    if (rtdbProducts.length === 0 && !rtdbSeeded) {
      void seedProductsIfEmpty(authUser, DEFAULT_PRODUCTS)
        .then((seeded) => {
          if (seeded) {
            setRtdbSeeded(true);
          }
        })
        .catch((err) => {
          console.warn('Initial catalog seed failed:', err);
        });
    }
  }, [
    authReady,
    isRealtimeAdmin,
    authUser,
    rtdbLoaded,
    rtdbProducts.length,
    rtdbSeeded,
  ]);

  // Public catalog is synchronized via Firebase Realtime Database; favorites and cart remain per-device locally.

  const products = useMemo(() => {
    if (rtdbProducts.length > 0 || rtdbSeeded) {
      return rtdbProducts;
    }
    return DEFAULT_PRODUCTS;
  }, [rtdbProducts, rtdbSeeded]);

  const rtdbProductIds = useMemo(
    () => new Set(rtdbProducts.map((p) => p.id)),
    [rtdbProducts],
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

    // Force-refresh JWT so Realtime Database rules receive email_verified: true immediately
    await credential.user.getIdToken(true);

    const adminStatus = await checkIsRealtimeAdmin(credential.user);
    setAuthUser(credential.user);
    setIsRealtimeAdmin(adminStatus);
    if (!adminStatus) {
      throw new Error('NOT_ADMIN_ACCOUNT');
    }
  }, []);

  const handleAdminSignOut = useCallback(async () => {
    await signOut(auth);
    setIsRealtimeAdmin(false);
  }, []);

  const handleSeedDatabase = useCallback(
    async (excludeId?: number): Promise<boolean> => {
      if (!authUser || !isRealtimeAdmin) return false;
      const itemsToSeed =
        typeof excludeId === 'number'
          ? DEFAULT_PRODUCTS.filter((item) => item.id !== excludeId)
          : DEFAULT_PRODUCTS;
      const seeded = await seedProductsIfEmpty(authUser, itemsToSeed);
      setRtdbSeeded(true);
      return seeded;
    },
    [authUser, isRealtimeAdmin],
  );

  const handleToggleFavorite = (id: number) => {
    const willBeFavorite = !favoriteIds.includes(id);
    setFavoriteIds((prev) =>
      willBeFavorite ? [...prev, id] : prev.filter((itemId) => itemId !== id),
    );
  };

  const handleAddToCart = (product: ProductItem) => {
    const nextQty = (cartQuantities[product.id] ?? 0) + 1;
    setCartQuantities((prev) => ({
      ...prev,
      [product.id]: nextQty,
    }));
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
  };

  const handleRemoveCartItem = (id: number) => {
    setCartQuantities((prev) => {
      const copy = {...prev};
      delete copy[id];
      return copy;
    });
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
          isAdmin={isRealtimeAdmin}
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
              isAdmin={isRealtimeAdmin}
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
        isAdmin={isRealtimeAdmin}
        onPasswordSignIn={handlePasswordSignIn}
        onLogout={() => {
          void handleAdminSignOut();
        }}
        dbProductIds={rtdbProductIds}
        dbReadError={rtdbReadError}
        onSeedDatabase={handleSeedDatabase}
        products={products}
        initialEditProductId={quickEditId}
      />
    </div>
  );
}
