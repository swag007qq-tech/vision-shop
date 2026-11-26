import React, {useEffect, useState} from 'react';
import {type User} from 'firebase/auth';
import {AnimatePresence, motion} from 'motion/react';
import {
  Check,
  Database,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {ProductItem, RARITY_OPTIONS, RarityCode} from '../data/products';
import {ADMIN_LOGIN_EMAIL} from '../firebase';
import {
  createProductInFirestore,
  deleteProductFromFirestore,
  updateProductInFirestore,
} from '../services/firestoreService';
import {RarityBadge} from './RarityBadge';
import {GemIcon, PlaceholderStarIcon} from './VisionIllustrations';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  authUser: User | null;
  isFirestoreAdmin: boolean;
  onPasswordSignIn: (password: string) => Promise<void>;
  onLogout: () => void;
  firestoreProductIds: Set<number>;
  onSeedFirestore: () => Promise<void>;
  products: ProductItem[];
  initialEditProductId?: number | null;
}

interface ProductFormState {
  name: string;
  price: string;
  gemValue: string;
  imageUrl: string;
  rarity: RarityCode;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  price: '',
  gemValue: '',
  imageUrl: '',
  rarity: '',
};

function extractReadableErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as {error?: unknown};
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        return parsed.error.trim();
      }
    } catch {
      // ignore non-JSON messages
    }
  }
  return raw;
}

function formatPasswordAuthError(error: unknown): string {
  const msg = extractReadableErrorMessage(error);
  const lower = msg.toLowerCase();
  if (msg === 'EMAIL_NOT_VERIFIED') {
    return `На ${ADMIN_LOGIN_EMAIL} отправлена одноразовая ссылка подтверждения. Перейдите по ней и снова нажмите «Войти».`;
  }
  if (msg === 'NOT_ADMIN_ACCOUNT') {
    return `Доступ к базе разрешён только владельцу (${ADMIN_LOGIN_EMAIL}) с подтверждённым email.`;
  }
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return `Нет доступа к базе Firestore. Проверьте, что правила firestore.rules развёрнуты в Firebase и вход выполнен в ${ADMIN_LOGIN_EMAIL}.`;
  }
  if (msg.includes('auth/operation-not-allowed')) {
    return 'В Firebase не включён вход по паролю (Email/Password). Откройте Firebase Console → Authentication → Sign-in method → Email/Password и включите его.';
  }
  if (
    msg.includes('auth/invalid-credential') ||
    msg.includes('auth/wrong-password') ||
    msg.includes('auth/user-not-found')
  ) {
    return 'Неверный пароль администратора.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Слишком много попыток входа. Подождите пару минут и попробуйте снова.';
  }
  return msg || 'Не удалось выполнить вход';
}

function formatFirestorePanelError(error: unknown, fallback: string): string {
  const msg = extractReadableErrorMessage(error);
  const lower = msg.toLowerCase();
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return `Нет прав на изменение товаров в Firestore. Проверьте, что правила firestore.rules развёрнуты в Firebase для ${ADMIN_LOGIN_EMAIL}.`;
  }
  return msg || fallback;
}

function RaritySelector({
  value,
  onChange,
}: {
  value: RarityCode;
  onChange: (next: RarityCode) => void;
}) {
  return (
    <div>
      <span className="block text-[12px] font-bold text-[#141414] mb-1.5">
        Редкость (необязательно)
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onChange('')}
          className={`px-3 py-1.5 min-h-[38px] rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
            value === ''
              ? 'bg-[#141414] text-white border-[#141414]'
              : 'bg-white text-neutral-700 border-black/25 hover:bg-neutral-100'
          }`}
        >
          Без знака
        </button>

        {RARITY_OPTIONS.map((opt) => {
          const active = value === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => onChange(active ? '' : opt.code)}
              aria-pressed={active}
              title={`Редкость ${opt.label}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] rounded-xl border transition-all cursor-pointer ${
                active
                  ? 'border-[#141414] bg-neutral-100 ring-2 ring-[#141414]'
                  : 'border-black/20 bg-white hover:bg-neutral-50'
              }`}
            >
              <RarityBadge rarity={opt.code} sizeClass="w-6 h-6" />
              <span className="text-[12px] font-extrabold text-[#141414]">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminModal({
  open,
  onClose,
  authUser,
  isFirestoreAdmin,
  onPasswordSignIn,
  onLogout,
  firestoreProductIds,
  onSeedFirestore,
  products,
  initialEditProductId = null,
}: AdminModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ProductFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ProductFormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [panelError, setPanelError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setAuthError('');
    setPanelError('');
    setConfirmDeleteId(null);

    if (initialEditProductId) {
      const target = products.find((p) => p.id === initialEditProductId);
      if (target) {
        setEditingId(target.id);
        setEditForm({
          name: target.name,
          price: String(target.price),
          gemValue: String(target.gemValue),
          imageUrl: target.imageUrl,
          rarity: target.rarity ?? '',
        });
      }
    }
  }, [open, initialEditProductId, products]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      setAuthError('Введите пароль администратора');
      return;
    }
    setAuthError('');
    setPanelError('');
    setLoginLoading(true);
    try {
      await onPasswordSignIn(trimmed);
      setPassword('');
    } catch (error) {
      setAuthError(formatPasswordAuthError(error));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<ProductFormState>>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type)) {
      setPanelError('Поддерживаются только PNG, JPG, WEBP или GIF');
      return;
    }
    if (file.size > 600_000) {
      setPanelError('Размер изображения не должен превышать 600 КБ');
      return;
    }
    setPanelError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter((prev) => ({...prev, imageUrl: reader.result as string}));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirestoreAdmin || !authUser) return;
    setPanelError('');

    const priceNum = Number(addForm.price.replace(',', '.'));
    const gemNum = Number(addForm.gemValue.replace(',', '.'));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setPanelError('Укажите корректную цену');
      return;
    }
    if (!Number.isFinite(gemNum) || gemNum < 0) {
      setPanelError('Укажите корректное число гемов');
      return;
    }

    const payload = {
      name: addForm.name.trim(),
      price: priceNum,
      gemValue: gemNum,
      imageUrl: addForm.imageUrl.trim(),
      rarity: addForm.rarity,
    };

    setSaving(true);
    try {
      if (firestoreProductIds.size === 0 && products.length > 0) {
        await onSeedFirestore();
      }
      await createProductInFirestore(authUser, products, payload);
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (error) {
      setPanelError(formatFirestorePanelError(error, 'Ошибка при сохранении товара в базу'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!isFirestoreAdmin || !authUser) return;
    setPanelError('');

    const priceNum = Number(editForm.price.replace(',', '.'));
    const gemNum = Number(editForm.gemValue.replace(',', '.'));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setPanelError('Укажите корректную цену');
      return;
    }
    if (!Number.isFinite(gemNum) || gemNum < 0) {
      setPanelError('Укажите корректное число гемов');
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      price: priceNum,
      gemValue: gemNum,
      imageUrl: editForm.imageUrl.trim(),
      rarity: editForm.rarity,
    };

    setSaving(true);
    try {
      if (firestoreProductIds.size === 0 && products.length > 0) {
        await onSeedFirestore();
      }
      await updateProductInFirestore(id, payload);
      setEditingId(null);
    } catch (error) {
      setPanelError(formatFirestorePanelError(error, 'Ошибка при обновлении товара в базе'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!isFirestoreAdmin || !authUser) return;
    setPanelError('');
    setSaving(true);
    try {
      if (firestoreProductIds.size === 0 && products.length > 0) {
        await onSeedFirestore();
      }
      await deleteProductFromFirestore(id);
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);
    } catch (error) {
      setPanelError(formatFirestorePanelError(error, 'Ошибка при удалении товара из базы'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Панель администратора"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.18}}
            onClick={onClose}
            className="fixed inset-0 bg-black/50"
          />

          <motion.div
            initial={{opacity: 0, scale: 0.96, y: 12}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.96, y: 12}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
            className={`relative z-10 w-full ${
              isFirestoreAdmin ? 'max-w-[660px]' : 'max-w-[440px]'
            } max-h-[90vh] bg-white border-[2px] border-[#141414] rounded-[28px] sm:rounded-[34px] shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-black/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-full bg-[#141414] text-white flex items-center justify-center shrink-0">
                  {isFirestoreAdmin ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                </span>
                <h2 className="text-[17px] sm:text-[20px] font-extrabold text-[#141414] truncate">
                  {isFirestoreAdmin ? 'Админ-панель' : 'Вход администратора'}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isFirestoreAdmin && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-full border-[1.5px] border-[#1A1A1A] text-[12px] sm:text-[13px] font-bold text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Выйти</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="w-10 h-10 rounded-full border-[1.5px] border-[#1A1A1A] flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isFirestoreAdmin ? (
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <p className="text-[14px] font-semibold text-neutral-600 leading-snug">
                    Введите пароль администратора, чтобы управлять товарами.
                  </p>

                  <div>
                    <label
                      htmlFor="admin-password-input"
                      className="block text-[12px] font-bold text-[#141414] mb-1.5"
                    >
                      Пароль
                    </label>
                    <div className="relative">
                      <input
                        id="admin-password-input"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        autoFocus
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите пароль"
                        className="w-full px-4 py-3 pr-11 rounded-2xl border-[1.5px] border-[#1A1A1A] bg-white text-[15px] font-semibold text-[#141414] focus:outline-none focus:ring-2 focus:ring-black/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full min-h-[48px] py-3 px-5 rounded-full bg-[#141414] text-white text-[15px] font-bold hover:bg-black active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>{loginLoading ? 'Вход...' : 'Войти'}</span>
                  </button>
                </form>

                {authError && (
                  <p
                    role="alert"
                    className="p-3 rounded-2xl bg-red-50 border border-red-200 text-[12px] font-bold text-red-700 leading-snug"
                  >
                    {authError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Database Sync Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl border border-black/15 bg-[#FAFAFA] text-[12px] font-bold text-[#141414]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="w-4 h-4 shrink-0" />
                    <span className="truncate">База товаров подключена</span>
                  </div>
                </div>

                {panelError && (
                  <div
                    role="alert"
                    className="p-3 rounded-2xl bg-red-50 border border-red-200 text-[13px] font-bold text-red-700"
                  >
                    {panelError}
                  </div>
                )}

                {/* Add Product Toggle & Form */}
                <div className="rounded-[24px] border-[1.5px] border-[#1A1A1A] p-3.5 sm:p-4 bg-neutral-50/70">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] sm:text-[16px] font-extrabold text-[#141414]">
                        Товары на сайте ({products.length})
                      </h3>
                      <p className="text-[12px] font-medium text-neutral-500">
                        Все изменения сразу видны всем посетителям сайта
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddForm((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-full bg-[#141414] text-white text-[13px] sm:text-[14px] font-bold hover:bg-black active:scale-95 transition-transform cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.6} />
                      <span>{showAddForm ? 'Скрыть' : 'Добавить'}</span>
                    </button>
                  </div>

                  {showAddForm && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="mt-4 pt-4 border-t border-black/10 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[12px] font-bold text-[#141414] mb-1">
                            Название (необяз.)
                          </label>
                          <input
                            type="text"
                            maxLength={80}
                            value={addForm.name}
                            onChange={(e) => setAddForm((f) => ({...f, name: e.target.value}))}
                            placeholder="Например: Стартер"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/30 bg-white text-[14px] font-semibold focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-[#141414] mb-1">
                            Цена (₴)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            value={addForm.price}
                            onChange={(e) => setAddForm((f) => ({...f, price: e.target.value}))}
                            placeholder="49"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/30 bg-white text-[14px] font-semibold tabular-nums focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-[#141414] mb-1">
                            Гемы
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            value={addForm.gemValue}
                            onChange={(e) =>
                              setAddForm((f) => ({...f, gemValue: e.target.value}))
                            }
                            placeholder="1.2"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-black/30 bg-white text-[14px] font-semibold tabular-nums focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <input
                          type="url"
                          value={addForm.imageUrl.startsWith('data:') ? '' : addForm.imageUrl}
                          onChange={(e) =>
                            setAddForm((f) => ({...f, imageUrl: e.target.value}))
                          }
                          placeholder="Ссылка на фото (https://...) или загрузите файл"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/30 bg-white text-[13px] font-medium focus:outline-none focus:border-black"
                        />

                        <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-[1.5px] border-[#1A1A1A] bg-white text-[13px] font-bold text-[#141414] hover:bg-neutral-100 cursor-pointer whitespace-nowrap shrink-0">
                          <ImagePlus className="w-4 h-4" />
                          <span>Загрузить фото</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => handleImageFileChange(e, setAddForm)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {addForm.imageUrl && (
                        <div className="flex items-center gap-3">
                          <img
                            src={addForm.imageUrl}
                            alt="Предпросмотр"
                            referrerPolicy="no-referrer"
                            className="w-14 h-12 rounded-xl object-cover border border-black/20"
                          />
                          <button
                            type="button"
                            onClick={() => setAddForm((f) => ({...f, imageUrl: ''}))}
                            className="text-[12px] font-bold text-neutral-600 hover:text-black underline cursor-pointer"
                          >
                            Убрать фото (оставить звёздочку)
                          </button>
                        </div>
                      )}

                      <RaritySelector
                        value={addForm.rarity}
                        onChange={(rarity) => setAddForm((f) => ({...f, rarity}))}
                      />

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-full bg-[#141414] text-white text-[14px] font-bold hover:bg-black active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>{saving ? 'Сохранение...' : 'Сохранить товар'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Existing Products List */}
                <div className="space-y-2.5">
                  {products.length === 0 ? (
                    <div className="py-8 text-center text-[14px] font-semibold text-neutral-500">
                      Товаров пока нет. Нажмите «Добавить», чтобы создать первый товар.
                    </div>
                  ) : (
                    products.map((item) => {
                      const isEditing = editingId === item.id;
                      const isConfirmDelete = confirmDeleteId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="p-3 sm:p-3.5 rounded-[22px] bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_3px_10px_rgba(0,0,0,0.04)]"
                        >
                          {!isEditing ? (
                            <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-14 h-12 rounded-xl bg-[#F4F4F4] border border-[#141414]/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name || `Товар #${item.id}`}
                                      loading="lazy"
                                      decoding="async"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <PlaceholderStarIcon className="w-8 h-8 text-[#D0D0D0]" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[16px] font-extrabold text-[#141414] tabular-nums">
                                      {item.price} ₴
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[13px] font-bold text-neutral-600 tabular-nums">
                                      <GemIcon className="w-3.5 h-3.5" />
                                      <span>{item.gemValue}</span>
                                    </span>
                                    {item.rarity && (
                                      <RarityBadge rarity={item.rarity} sizeClass="w-5 h-5" />
                                    )}
                                  </div>
                                  <p className="text-[12px] font-semibold text-neutral-500 truncate">
                                    {item.name || `Карточка #${item.id}`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditForm({
                                      name: item.name,
                                      price: String(item.price),
                                      gemValue: String(item.gemValue),
                                      imageUrl: item.imageUrl,
                                      rarity: item.rarity ?? '',
                                    });
                                    setConfirmDeleteId(null);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-full border-[1.5px] border-[#1A1A1A] text-[12px] sm:text-[13px] font-bold text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Изменить</span>
                                </button>

                                {isConfirmDelete ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => handleDeleteProduct(item.id)}
                                      className="px-3 py-2 min-h-[38px] rounded-full bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 cursor-pointer"
                                    >
                                      Удалить
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2.5 py-2 min-h-[38px] rounded-full border border-black/25 text-[12px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                                    >
                                      Нет
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(item.id)}
                                    aria-label="Удалить товар"
                                    className="w-9 h-9 rounded-full border border-black/20 flex items-center justify-center text-neutral-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 active:scale-90 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                                    Название
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={80}
                                    value={editForm.name}
                                    onChange={(e) =>
                                      setEditForm((f) => ({...f, name: e.target.value}))
                                    }
                                    placeholder="Без названия"
                                    className="w-full px-3 py-2 rounded-xl border border-black/30 text-[13px] font-semibold focus:outline-none focus:border-black"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                                    Цена (₴)
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) =>
                                      setEditForm((f) => ({...f, price: e.target.value}))
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-black/30 text-[13px] font-semibold tabular-nums focus:outline-none focus:border-black"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                                    Гемы
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editForm.gemValue}
                                    onChange={(e) =>
                                      setEditForm((f) => ({...f, gemValue: e.target.value}))
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-black/30 text-[13px] font-semibold tabular-nums focus:outline-none focus:border-black"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                <input
                                  type="url"
                                  value={
                                    editForm.imageUrl.startsWith('data:') ? '' : editForm.imageUrl
                                  }
                                  onChange={(e) =>
                                    setEditForm((f) => ({...f, imageUrl: e.target.value}))
                                  }
                                  placeholder="Ссылка на фото (https://...)"
                                  className="flex-1 px-3 py-2 rounded-xl border border-black/30 text-[12px] font-medium focus:outline-none focus:border-black"
                                />

                                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#1A1A1A] text-[12px] font-bold cursor-pointer hover:bg-neutral-100 whitespace-nowrap">
                                  <ImagePlus className="w-3.5 h-3.5" />
                                  <span>Файл</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(e) => handleImageFileChange(e, setEditForm)}
                                    className="hidden"
                                  />
                                </label>

                                {editForm.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setEditForm((f) => ({...f, imageUrl: ''}))}
                                    className="px-2.5 py-2 rounded-xl text-[12px] font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer whitespace-nowrap"
                                  >
                                    Сбросить фото
                                  </button>
                                )}
                              </div>

                              <RaritySelector
                                value={editForm.rarity}
                                onChange={(rarity) => setEditForm((f) => ({...f, rarity}))}
                              />

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-4 py-2 min-h-[38px] rounded-full border border-black/25 text-[13px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                                >
                                  Отмена
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] rounded-full bg-[#141414] text-white text-[13px] font-bold hover:bg-black cursor-pointer disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
