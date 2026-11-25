/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect, useMemo, useState} from 'react';
import {AdminModal} from './components/AdminModal';
import {BackgroundScene} from './components/BackgroundScene';
import {BottomDock} from './components/BottomDock';
import {ActiveTab, HeaderBar} from './components/HeaderBar';
import {IntroSplash} from './components/IntroSplash';
import {ProductGrid} from './components/ProductGrid';
import {ReviewsBlock} from './components/ReviewsBlock';
import {CartDrawer, CartEntry, FavoritesDrawer} from './components/ShopDrawers';
import {DEFAULT_PRODUCTS, ProductItem} from './data/products';

const FIREBASE_API_KEY = 'AIzaSyBvRjFdSMab_8G6OO9n0i7JOnprLjfT3hM';
const FIREBASE_PROJECT_ID = 'vision-shop-2e31e';

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
    // ignore
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
    // ignore
  }
  return {};
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [introFinished, setIntroFinished] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(loadSavedFavorites);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>(loadSavedCart);
  const [activeDrawer, setActiveDrawer] = useState<'favorites' | 'cart' | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [quickEditId, setQuickEditId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchSharedProducts() {
      try {
        const url = https://googleapis.com{FIREBASE_PROJECT_ID}/databases/(default)/documents/products?key=${FIREBASE_API_KEY};
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.documents)) {
          const mapped: ProductItem[] = data.documents.map((doc: any) => {
            const f = doc.fields || {};
            const docId = Number(doc.name.split('/').pop());
            return {
              id: Number(f.id?.integerValue ?? f.id?.doubleValue ?? docId),
              name: String(f.name?.stringValue ?? ''),
              price: Number(f.price?.doubleValue ?? f.price?.integerValue ?? 0),
              gemValue: Number(f.gemValue?.doubleValue ?? f.gemValue?.integerValue ?? 0),
              imageUrl: String(f.imageUrl?.stringValue ?? ''),
              rarity: (f.rarity?.stringValue ?? '') as any,
            };
          });
          mapped.sort((a, b) => a.id - b.id);
          if (mapped.length > 0) {
            setProducts(mapped);
          }
        }
      } catch {
        // ignore network errors
      }
    }

    fetchSharedProducts();
    const interval = window.setInterval(fetchSharedProducts, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds]);
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartQuantities));
    } catch {
      // ignore
    }
  }, [cartQuantities]);

  const handleToggleFavorite = (id: number) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const handleAddToCart = (product: ProductItem) => {
    setCartQuantities((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] ?? 0) + 1,
    }));
  };

  const handleUpdateCartQty = (id: number, delta: number) => {
    setCartQuantities((prev) => {
      const nextQty = (prev[id] ?? 0) + delta;
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
          isAdmin={Boolean(adminToken)}
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
              isAdmin={Boolean(adminToken)}
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
        adminToken={adminToken}
        o
nAuthSuccess={(token) => setAdminToken(token)}
        onLogout={() => setAdminToken(null)}
        products={products}
        onProductsUpdated={(next) => setProducts(next)}
        initialEditProductId={quickEditId}
      />
    </div>
  );
}
  
