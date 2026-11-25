import React, {useEffect, useRef, useState} from 'react';
import {ChevronRight, ShieldCheck, ShoppingBag, Star} from 'lucide-react';
import {AudioPlayerControls, MusicPlayerPill} from './MusicPlayerPill';
import {SparkleIcon, UserSilhouetteIcon, VisionLogo} from './VisionIllustrations';

export type ActiveTab = 'catalog' | 'reviews';

interface HeaderBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export function HeaderBar({activeTab, onTabChange, isAdmin, onOpenAdmin}: HeaderBarProps) {
  const isCatalog = activeTab === 'catalog';
  const isReviews = activeTab === 'reviews';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(179);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSkipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = audio.currentTime <= 5 ? 0 : Math.max(0, audio.currentTime - 15);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
    const nextTime = audio.currentTime + 15 >= total ? 0 : audio.currentTime + 15;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleChangeVolume = (val: number) => {
    setVolume(val);
    if (val > 0 && muted) {
      setMuted(false);
    }
  };

  const handleToggleMute = () => {
    setMuted((prev) => !prev);
  };

  const playerControls: AudioPlayerControls = {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    onTogglePlay: handleTogglePlay,
    onSkipBack: handleSkipBack,
    onSkipForward: handleSkipForward,
    onChangeVolume: handleChangeVolume,
    onToggleMute: handleToggleMute,
  };

  return (
    <header className="relative z-20 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-2 sm:pb-4">
      {/* Single shared audio element for Платина — kawaii (full 2:59 track) */}
      <audio
        ref={audioRef}
        src="/assets/audio/kawaii.mp3"
        preload="metadata"
        loop
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Desktop & Laptop layout (>= lg): exact 1:1 proportions matching reference */}
      <div className="hidden lg:grid lg:grid-cols-[310px_1fr_290px] items-start gap-4">
        {/* Left: Exact Vision shop logo + peeking puppy */}
        <div className="flex items-start justify-start -mt-1">
          <VisionLogo className="w-[300px] xl:w-[325px] h-auto shrink-0" />
        </div>

        {/* Center: Navigation segmented pill + Now Playing audio pill */}
        <div className="flex flex-col items-center gap-6 pt-5 min-w-0">
          {/* Segmented Nav: Каталог ✦ | Отзывы */}
          <nav
            aria-label="Основная навигация"
            className="inline-flex items-center rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
          >
            <button
              type="button"
              onClick={() => onTabChange('catalog')}
              aria-pressed={isCatalog}
              className={`inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-[17px] font-bold tracking-tight transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black whitespace-nowrap shrink-0 cursor-pointer ${
                isCatalog
                  ? 'bg-[#141414] text-white border-[2px] border-[#141414] shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-black'
                  : 'bg-white text-[#141414] border-[1.5px] border-[#1A1A1A] shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:bg-neutral-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5 shrink-0" strokeWidth={2.2} />
              <span>Каталог</span>
              <SparkleIcon
                className={`w-4 h-4 shrink-0 ${isCatalog ? 'text-white' : 'text-[#141414]'}`}
              />
            </button>

            <button
              type="button"
              onClick={() => onTabChange('reviews')}
              aria-pressed={isReviews}
              className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-[17px] font-bold tracking-tight ml-1.5 transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black whitespace-nowrap shrink-0 cursor-pointer ${
                isReviews
                  ? 'bg-[#141414] text-white border-[2px] border-[#141414] shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-black'
                  : 'bg-white text-[#141414] border-[1.5px] border-[#1A1A1A] shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:bg-neutral-50'
              }`}
            >
              <Star className="w-5 h-5 shrink-0" strokeWidth={2.2} />
              <span>Отзывы</span>
            </button>
          </nav>

          <MusicPlayerPill variant="desktop" controls={playerControls} />
        </div>

        {/* Right: Admin Login / Panel Button */}
        <div className="flex items-start justify-end pt-3 pr-1">
          <button
            type="button"
            onClick={onOpenAdmin}
            className={`inline-flex items-center gap-3 px-5 py-3 rounded-full border-[1.5px] shadow-[0_6px_16px_rgba(0,0,0,0.08)] text-left transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black cursor-pointer shrink-0 ${
              isAdmin
                ? 'bg-[#141414] text-white border-[#141414] hover:bg-black'
                : 'bg-white text-[#141414] border-[#1A1A1A] hover:bg-neutral-50'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-7 h-7 shrink-0" />
            ) : (
              <UserSilhouetteIcon className="w-7 h-7 text-[#141414] shrink-0" />
            )}
            <span className="flex flex-col leading-tight">
              <span className="text-[14px] font-bold whitespace-nowrap">
                {isAdmin ? 'Админ-панель' : 'Войти'}
              </span>
              <span className="text-[13px] font-bold whitespace-nowrap">
                {isAdmin ? 'управление' : 'как администратор'}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 ml-1" strokeWidth={2.6} />
          </button>
        </div>
      </div>

      {/* Mobile & Tablet layout (< lg): adapts cleanly with zero horizontal scroll */}
      <div className="flex flex-col items-center gap-3 lg:hidden w-full">
        {/* Top Row: Exact Logo + Admin Login */}
        <div className="w-full flex items-center justify-between gap-2">
          <VisionLogo className="w-36 min-[380px]:w-44 sm:w-56 h-auto shrink-0" />

          <button
            type="button"
            onClick={onOpenAdmin}
            className={`inline-flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 rounded-full border-[1.5px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-left transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-black cursor-pointer shrink-0 max-w-[54%] ${
              isAdmin
                ? 'bg-[#141414] text-white border-[#141414] hover:bg-black'
                : 'bg-white text-[#141414] border-[#1A1A1A] hover:bg-neutral-50'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            ) : (
              <UserSilhouetteIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#141414] shrink-0" />
            )}
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-[12px] sm:text-[13px] font-bold truncate">
                {isAdmin ? 'Админка' : 'Войти'}
              </span>
              <span className="text-[10px] sm:text-[12px] font-bold truncate">
                {isAdmin ? (
                  'открыть'
                ) : (
                  <>
                    как админ
                    <span className="hidden sm:inline">истратор</span>
                  </>
                )}
              </span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} />
          </button>
        </div>

        {/* Middle Row: Catalog / Reviews Toggle */}
        <nav
          aria-label="Основная навигация"
          className="w-full max-w-[380px] grid grid-cols-2 gap-1.5"
        >
          <button
            type="button"
            onClick={() => onTabChange('catalog')}
            aria-pressed={isCatalog}
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 min-h-[44px] rounded-full text-[14px] sm:text-[15px] font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-black whitespace-nowrap cursor-pointer ${
              isCatalog
                ? 'bg-[#141414] text-white border-[1.5px] border-[#141414] shadow-[0_4px_12px_rgba(0,0,0,0.16)] hover:bg-black'
                : 'bg-white text-[#141414] border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:bg-neutral-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span>Каталог</span>
            <SparkleIcon
              className={`w-3.5 h-3.5 shrink-0 ${isCatalog ? 'text-white' : 'text-[#141414]'}`}
            />
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reviews')}
            aria-pressed={isReviews}
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 min-h-[44px] rounded-full text-[14px] sm:text-[15px] font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-black whitespace-nowrap cursor-pointer ${
              isReviews
                ? 'bg-[#141414] text-white border-[1.5px] border-[#141414] shadow-[0_4px_12px_rgba(0,0,0,0.16)] hover:bg-black'
                : 'bg-white text-[#141414] border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:bg-neutral-50'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span>Отзывы</span>
          </button>
        </nav>

        <MusicPlayerPill variant="mobile" controls={playerControls} />
      </div>
    </header>
  );
}
