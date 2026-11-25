import React from 'react';
import {Pause, Play, SkipBack, SkipForward, Volume2, VolumeX} from 'lucide-react';
import {DoubleNoteIcon} from './VisionIllustrations';

export interface AudioPlayerControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onChangeVolume: (value: number) => void;
  onToggleMute: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicPlayerPill({
  variant,
  controls,
}: {
  variant: 'desktop' | 'mobile';
  controls: AudioPlayerControls;
}) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    onTogglePlay,
    onSkipBack,
    onSkipForward,
    onChangeVolume,
    onToggleMute,
  } = controls;

  const effectiveVolume = muted ? 0 : volume;
  const timeLabel = duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '2:59';

  if (variant === 'desktop') {
    return (
      <div className="inline-flex items-center gap-4 px-3.5 py-2.5 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_6px_16px_rgba(0,0,0,0.1)] max-w-full">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Пауза' : 'Включить трек'}
          className="w-12 h-12 rounded-full bg-[#141414] text-white flex items-center justify-center shrink-0 hover:bg-black active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
        >
          <DoubleNoteIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col leading-tight pr-2 min-w-0 max-w-[190px]">
          <span className="text-[11px] font-medium text-neutral-500 whitespace-nowrap tabular-nums">
            Now Playing · {timeLabel}
          </span>
          <span className="text-[16px] font-extrabold text-[#141414] truncate">
            Платина — kawaii ♡
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSkipBack}
            aria-label="Перемотать назад"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            className="w-12 h-12 rounded-full bg-[#141414] text-white flex items-center justify-center hover:bg-black active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onSkipForward}
            aria-label="Перемотать вперёд"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-2 pl-1 pr-1.5 shrink-0">
          <div className="relative w-16 h-6 flex items-center">
            <div className="w-full h-[3.5px] rounded-full bg-neutral-300 overflow-hidden">
              <div
                className="h-full bg-[#141414] rounded-full"
                style={{width: `${effectiveVolume * 100}%`}}
              />
            </div>
            <div
              className="absolute w-3 h-3 rounded-full bg-[#141414] pointer-events-none -translate-x-1/2"
              style={{left: `${effectiveVolume * 100}%`}}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={effectiveVolume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              aria-label="Громкость"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
          >
            {muted || volume === 0 ? (
              <VolumeX className="w-5 h-5 shrink-0" strokeWidth={2.3} />
            ) : (
              <Volume2 className="w-5 h-5 shrink-0" strokeWidth={2.3} />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] flex items-center justify-between gap-2 px-2.5 sm:px-3.5 py-2 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Пауза' : 'Включить трек'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#141414] text-white flex items-center justify-center shrink-0 hover:bg-black active:scale-95 transition-transform cursor-pointer"
        >
          <DoubleNoteIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] sm:text-[11px] font-medium text-neutral-500 truncate tabular-nums">
            Now Playing · {timeLabel}
          </span>
          <span className="text-[13px] sm:text-[15px] font-extrabold text-[#141414] truncate">
            Платина — kawaii ♡
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onSkipBack}
          aria-label="Перемотать назад"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center hover:bg-black active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onSkipForward}
          aria-label="Перемотать вперёд"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="hidden min-[440px]:flex items-center gap-1.5 pr-0.5 shrink-0">
        <div className="relative w-11 h-6 flex items-center">
          <div className="w-full h-[3px] rounded-full bg-neutral-300 overflow-hidden">
            <div
              className="h-full bg-[#141414] rounded-full"
              style={{width: `${effectiveVolume * 100}%`}}
            />
          </div>
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-[#141414] pointer-events-none -translate-x-1/2"
            style={{left: `${effectiveVolume * 100}%`}}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={effectiveVolume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            aria-label="Громкость"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#141414] hover:bg-neutral-100 active:scale-95 transition-transform cursor-pointer"
        >
          {muted || volume === 0 ? (
            <VolumeX className="w-4 h-4 shrink-0" strokeWidth={2.3} />
          ) : (
            <Volume2 className="w-4 h-4 shrink-0" strokeWidth={2.3} />
          )}
        </button>
      </div>
    </div>
  );
}
