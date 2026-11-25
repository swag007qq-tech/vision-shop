import React, {useEffect} from 'react';
import {type User} from 'firebase/auth';
import {AnimatePresence, motion} from 'motion/react';
import {Cloud, Heart, LogOut, Minus, Plus, Trash2, X} from 'lucide-react';
import {ProductItem} from '../data/products';
import {RarityBadge} from './RarityBadge';
import {GemIcon, PlaceholderStarIcon, SolidCartIcon} from './VisionIllustrations';

export interface CartEntry {
  product: ProductItem;
  quantity: number;
}

function CloudSyncBar({
  authUser,
  onGoogleSignIn,
  onGoogleSignOut,
}: {
  authUser: User | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-b border-black/10 bg-neutral-50/80 text-[12px] font-bold text-[#141414]">
      <div className="flex items-center gap-1.5 min-w-0">
        <Cloud className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
        {authUser ? (
          <span className="truncate text-neutral-700">
            Синхронизация: {authUser.email}
          </span>
        ) : (
          <span className="truncate text-neutral-500">
            Сохранить в облачной базе данных
          </span>
        )}
      </div>

      {authUser ? (
        <button
          type="button"
          onClick={() => void onGoogleSignOut()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/20 bg-white text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer shrink-0"
        >
          <LogOut className="w-3 h-3" />
          <span>Выйти</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void onGoogleSignIn()}
          className="px-3 py-1 rounded-full bg-[#141414] text-white text-[11px] font-bold hover:bg-black cursor-pointer shrink-0 whitespace-nowrap"
        >
          Войти через Google
        </button>
      )}
    </div>
  );
}

interface FavoritesDrawerProps {
  open: boolean;
  onClose: () => void;
  items: ProductItem[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: ProductItem) => void;
  authUser: User | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}

export function FavoritesDrawer({
  open,
  onClose,
  items,
  onToggleFavorite,
  onAddToCart,
  authUser,
  onGoogleSignIn,
  onGoogleSignOut,
}: FavoritesDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Избранное"
          className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.18}}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{y: '100%', x: 0}}
            animate={{y: 0, x: 0}}
            exit={{y: '100%'}}
            transition={{duration: 0.24, ease: [0.16, 1, 0.3, 1]}}
            className="relative z-10 w-full sm:w-[420px] max-h-[86vh] sm:max-h-screen sm:h-full bg-white border-t-[2px] sm:border-t-0 sm:border-l-[2px] border-[#141414] rounded-t-[32px] sm:rounded-none sm:rounded-l-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#141414] text-white flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-current" />
                </span>
                <h2 className="text-[20px] font-extrabold text-[#141414] leading-none">
                  Избранное
                </h2>
                <span className="text-[14px] font-bold text-neutral-500 tabular-nums">
                  ({items.length})
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть избранное"
                className="w-10 h-10 rounded-full border-[1.5px] border-[#1A1A1A] flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <CloudSyncBar
              authUser={authUser}
              onGoogleSignIn={onGoogleSignIn}
              onGoogleSignOut={onGoogleSignOut}
            />

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4 py-8 gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#141414]">
                    <Heart className="w-8 h-8" strokeWidth={2.2} />
                  </div>
                  <p className="text-[17px] font-extrabold text-[#141414]">
                    В избранном пока пусто
                  </p>
                  <p className="text-[14px] font-medium text-neutral-500 max-w-[260px]">
                    Нажмите на сердечко на карточке товара, чтобы сразу сохранить его сюда.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-[22px] bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  >
                    <div className="w-16 h-16 rounded-[14px] bg-[#E3E3E3] flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name || `Товар #${item.id}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PlaceholderStarIcon className="w-10 h-10 text-[#C7C7C7]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {item.name && (
                        <div className="text-[12px] font-bold text-neutral-500 truncate">
                          {item.name}
                        </div>
                      )}
                      <div className="text-[18px] font-extrabold text-[#141414] tabular-nums leading-tight">
                        {item.price} ₴
                      </div>
                      <div className="flex items-center gap-1.5 text-[14px] font-semibold text-neutral-700 tabular-nums mt-0.5">
                        <GemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.gemValue}</span>
                        {item.rarity && (
                          <RarityBadge rarity={item.rarity} sizeClass="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full bg-[#141414] text-white text-[13px] font-bold hover:bg-black active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
                      >
                        <SolidCartIcon className="w-4 h-4 shrink-0" />
                        <span>В корзину</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label="Убрать из избранного"
                        className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center text-[#E11D48] hover:bg-neutral-100 active:scale-90 transition-transform cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: CartEntry[];
  onUpdateQty: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  authUser: User | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}

export function CartDrawer({
  open,
  onClose,
  entries,
  onUpdateQty,
  onRemoveItem,
  authUser,
  onGoogleSignIn,
  onGoogleSignOut,
}: CartDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const totalCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalPrice = entries.reduce(
    (sum, entry) => sum + entry.product.price * entry.quantity,
    0,
  );
  const totalGems = entries.reduce(
    (sum, entry) => sum + entry.product.gemValue * entry.quantity,
    0,
  );
  const formattedGems = Number.isInteger(totalGems)
    ? String(totalGems)
    : totalGems.toFixed(1).replace(/\.0$/, '');

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Корзина"
          className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.18}}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{y: '100%'}}
            animate={{y: 0}}
            exit={{y: '100%'}}
            transition={{duration: 0.24, ease: [0.16, 1, 0.3, 1]}}
            className="relative z-10 w-full sm:w-[440px] max-h-[88vh] sm:max-h-screen sm:h-full bg-white border-t-[2px] sm:border-t-0 sm:border-l-[2px] border-[#141414] rounded-t-[32px] sm:rounded-none sm:rounded-l-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#141414] text-white flex items-center justify-center shrink-0">
                  <SolidCartIcon className="w-4 h-4" />
                </span>
                <h2 className="text-[20px] font-extrabold text-[#141414] leading-none">
                  Корзина
                </h2>
                <span className="text-[14px] font-bold text-neutral-500 tabular-nums">
                  ({totalCount})
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть корзину"
                className="w-10 h-10 rounded-full border-[1.5px] border-[#1A1A1A] flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <CloudSyncBar
              authUser={authUser}
              onGoogleSignIn={onGoogleSignIn}
              onGoogleSignOut={onGoogleSignOut}
            />

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
              {entries.length === 0 ? (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4 py-8 gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#141414]">
                    <SolidCartIcon className="w-8 h-8" />
                  </div>
                  <p className="text-[17px] font-extrabold text-[#141414]">
                    Корзина пока пуста
                  </p>
                  <p className="text-[14px] font-medium text-neutral-500 max-w-[260px]">
                    Нажмите «Купить» на любом товаре, чтобы добавить его в корзину.
                  </p>
                </div>
              ) : (
                entries.map(({product, quantity}) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-[22px] bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  >
                    <div className="w-16 h-16 rounded-[14px] bg-[#E3E3E3] flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name || `Товар #${product.id}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PlaceholderStarIcon className="w-10 h-10 text-[#C7C7C7]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {product.name && (
                        <div className="text-[12px] font-bold text-neutral-500 truncate">
                          {product.name}
                        </div>
                      )}
                      <div className="text-[18px] font-extrabold text-[#141414] tabular-nums leading-tight">
                        {product.price * quantity} ₴
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-600 tabular-nums mt-0.5">
                        <GemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {(product.gemValue * quantity).toFixed(1).replace(/\.0$/, '')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{product.price} ₴ / шт</span>
                        {product.rarity && (
                          <RarityBadge rarity={product.rarity} sizeClass="w-4 h-4 ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="inline-flex items-center rounded-full border-[1.5px] border-[#1A1A1A] bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, -1)}
                          aria-label="Уменьшить количество"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-90 transition-transform cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" strokeWidth={2.6} />
                        </button>
                        <span className="min-w-[24px] text-center text-[14px] font-extrabold text-[#141414] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, 1)}
                          aria-label="Увеличить количество"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-90 transition-transform cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        aria-label="Удалить товар"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-[#141414] hover:bg-neutral-100 active:scale-90 transition-transform cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Total Sum & Купить link to @MySisii */}
            <div className="px-5 py-4 border-t-[1.5px] border-black/15 bg-white space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-neutral-500">
                    Сумма всех товаров
                  </span>
                  {entries.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-neutral-700 tabular-nums mt-0.5">
                      <GemIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{formattedGems}</span>
                    </span>
                  )}
                </div>

                <div className="text-[26px] font-black text-[#141414] tabular-nums leading-none">
                  {totalPrice} ₴
                </div>
              </div>

              {entries.length > 0 ? (
                <a
                  href="https://t.me/MySisii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] py-3 px-6 rounded-full bg-[#141414] text-white text-[16px] font-bold inline-flex items-center justify-center gap-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-all duration-150 hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <SolidCartIcon className="w-5 h-5 shrink-0" />
                  <span>Купить</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[48px] py-3 px-6 rounded-full bg-neutral-200 text-neutral-500 text-[16px] font-bold inline-flex items-center justify-center gap-2.5 cursor-not-allowed"
                >
                  <SolidCartIcon className="w-5 h-5 shrink-0" />
                  <span>Купить</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
