import React from 'react';
import {SparkleIcon} from './VisionIllustrations';

function StarSpeechBubble({className = 'w-24 sm:w-28 h-auto'}: {className?: string}) {
  return (
    <svg viewBox="0 0 150 140" className={className} fill="none" aria-hidden="true">
      {/* Three comic burst rays at top */}
      <path
        d="M32 34L22 14"
        stroke="#141414"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M54 27L52 6"
        stroke="#141414"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M78 28L88 10"
        stroke="#141414"
        strokeWidth="6.5"
        strokeLinecap="round"
      />

      {/* Offset bold black drop shadow */}
      <g transform="translate(-5, 6) rotate(-11 72 82)">
        <path
          d="M24 44C24 32 34 24 46 24H106C118 24 128 32 128 44V86C128 98 118 106 106 106H94L96 126L74 106H46C34 106 24 98 24 86V44Z"
          fill="#141414"
        />
      </g>

      {/* Main white tilted speech bubble */}
      <g transform="rotate(-11 72 82)">
        <path
          d="M24 44C24 32 34 24 46 24H106C118 24 128 32 128 44V86C128 98 118 106 106 106H94L96 126L74 106H46C34 106 24 98 24 86V44Z"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* Solid rounded black star inside */}
        <path
          d="M76 41C77.5 41 78.9 41.9 79.5 43.3L84 53L94.6 54.4C96.2 54.6 97.5 55.7 98 57.3C98.5 58.9 98 60.6 96.8 61.7L89 69.1L91 79.6C91.3 81.2 90.6 82.8 89.3 83.7C88 84.6 86.2 84.8 84.8 84L76 78.9L67.2 84C65.8 84.8 64 84.6 62.7 83.7C61.4 82.8 60.7 81.2 61 79.6L63 69.1L55.2 61.7C54 60.6 53.5 58.9 54 57.3C54.5 55.7 55.8 54.6 57.4 54.4L68 53L72.5 43.3C73.1 41.9 74.5 41 76 41Z"
          fill="#141414"
        />
      </g>
    </svg>
  );
}

function DoubleHearts({className = 'w-20 sm:w-24 h-auto'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none" aria-hidden="true">
      {/* Large heart */}
      <g transform="rotate(-12 45 45)">
        <path
          d="M45 78C45 78 14 58 14 35C14 23 23 15 33 15C39 15 43 18 45 22C47 18 51 15 57 15C67 15 76 23 76 35C76 58 45 78 45 78Z"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
      </g>
      {/* Small heart */}
      <g transform="translate(56, 42) rotate(12 24 24)">
        <path
          d="M24 44C24 44 6 32 6 19C6 12 11 7 17 7C20.5 7 23 9 24 11.5C25 9 27.5 7 31 7C37 7 42 12 42 19C42 32 24 44 24 44Z"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function ClickHandIcon({className = 'w-12 h-12 sm:w-14 sm:h-14'}: {className?: string}) {
  return (
    <svg viewBox="0 0 80 84" className={className} fill="none" aria-hidden="true">
      {/* Click burst rays */}
      <path d="M22 18L13 13" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M28 11L25 2" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M37 11L42 2" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M44 17L53 12" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />

      {/* Pointing hand cursor with crisp white outer outline and dark stroke */}
      <g transform="rotate(-14 40 48)">
        <path
          d="M32 20C32 16.5 37 16.5 37 20V38H40C42.5 38 44 39.5 44 41.5V42.5H47C49.5 42.5 51 44 51 46V47H53.5C55.8 47 57.5 48.8 57.5 51V60C57.5 68 51.5 74 43 74H36C29.5 74 25 69.5 23 63.5L18.5 52C17.2 48.8 21.5 46 24.2 48.5L29 53V20H32Z"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M34 51V62M41 51V62M48 53V62"
          stroke="#141414"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function ReviewsBlock() {
  return (
    <section
      aria-label="Отзывы клиентов"
      className="relative z-10 w-full max-w-[900px] mx-auto px-3 sm:px-6 py-4 sm:py-8 flex items-center justify-center"
    >
      <div className="relative w-full max-w-[760px] pt-6 pb-4 px-1 sm:px-4">
        {/* Top-left tilted speech bubble with star */}
        <div className="absolute -top-2 -left-1 sm:-top-4 sm:-left-3 z-20 pointer-events-none select-none">
          <StarSpeechBubble className="w-20 min-[400px]:w-24 sm:w-32 h-auto" />
        </div>

        {/* Top-right double outlined hearts */}
        <div className="absolute -top-1 right-1 sm:-top-3 sm:right-4 z-20 pointer-events-none select-none">
          <DoubleHearts className="w-16 min-[400px]:w-20 sm:w-28 h-auto" />
        </div>

        {/* Main rounded hand-drawn frame */}
        <div className="relative overflow-hidden rounded-[36px] sm:rounded-[56px] bg-white border-[2.5px] sm:border-[3.5px] border-[#141414] shadow-[0_12px_32px_rgba(0,0,0,0.08)] px-5 min-[420px]:px-8 sm:px-14 pt-12 sm:pt-12 pb-8 sm:pb-10">
          {/* Decorative internal ink blobs matching photo */}
          <svg
            viewBox="0 0 120 120"
            className="absolute bottom-0 left-0 w-16 sm:w-24 h-auto text-[#EAEAEA] pointer-events-none select-none"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M0 18C26 24 44 48 36 74C30 94 64 98 86 120H0V18Z" />
          </svg>

          <svg
            viewBox="0 0 160 120"
            className="absolute top-0 right-10 sm:right-16 w-24 sm:w-32 h-auto pointer-events-none select-none"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M28 0C48 20 84 22 108 0H28Z"
              fill="#141414"
            />
            <path
              d="M12 0C22 30 62 36 76 12C84 -2 36 0 12 0Z"
              fill="#E5E5E5"
              opacity="0.8"
            />
          </svg>

          <svg
            viewBox="0 0 120 120"
            className="absolute top-10 right-0 w-14 sm:w-20 h-auto text-[#EAEAEA] pointer-events-none select-none"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M120 10C92 18 78 44 92 68C102 86 112 96 120 106V10Z" />
          </svg>

          <svg
            viewBox="0 0 220 140"
            className="absolute bottom-0 right-0 w-28 sm:w-44 h-auto pointer-events-none select-none"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M50 140C66 106 102 98 134 108C164 118 192 94 220 56V140H50Z"
              fill="#EAEAEA"
            />
            <path
              d="M104 140C122 102 152 108 176 82C194 62 204 42 220 34V140H104Z"
              fill="#141414"
            />
          </svg>

          {/* Bottom corner 4-point sparkles */}
          <SparkleIcon className="absolute bottom-6 left-6 sm:bottom-8 sm:left-10 w-5 h-5 sm:w-7 sm:h-7 text-[#141414] pointer-events-none" />
          <SparkleIcon className="absolute bottom-4 left-12 sm:bottom-5 sm:left-20 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#141414] pointer-events-none" />
          <SparkleIcon className="absolute bottom-10 right-7 sm:bottom-12 sm:right-14 w-5 h-5 sm:w-7 sm:h-7 text-[#141414] pointer-events-none" />

          {/* Center Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 mb-5 sm:mb-7">
              <p className="text-[19px] min-[400px]:text-[22px] sm:text-[31px] font-bold text-[#141414] leading-snug tracking-tight">
                всё пруфы выдачи и
              </p>

              <p className="inline-block px-4 sm:px-6 py-0.5 sm:py-1 rounded-full bg-[#E4E4E4] text-[19px] min-[400px]:text-[22px] sm:text-[31px] font-black text-[#141414] leading-snug tracking-tight">
                отзывы от клиентов
              </p>

              <p className="inline-flex items-center justify-center flex-wrap gap-1.5 text-[19px] min-[400px]:text-[22px] sm:text-[31px] font-bold text-[#141414] leading-snug tracking-tight">
                <span>можно посмотреть тут -</span>
                <svg
                  viewBox="0 0 28 32"
                  className="w-5 h-5 sm:w-7 sm:h-7 text-[#141414] shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7L15 3M5 16H21M3 25L15 29"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </p>
            </div>

            {/* ЖМЯК Telegram CTA Button */}
            <a
              href="https://t.me/ReviewsBYVision"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center p-[3px] sm:p-[4px] rounded-full bg-white border-[2px] border-[#141414] shadow-[0_8px_20px_rgba(0,0,0,0.14)] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
              <span className="relative inline-flex items-center justify-center gap-4 sm:gap-7 px-7 min-[400px]:px-10 sm:px-14 py-3 sm:py-3.5 min-h-[52px] rounded-full bg-gradient-to-b from-[#2E2E2E] via-[#141414] to-[#0A0A0A] text-white">
                <SparkleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />

                <span className="text-[22px] min-[400px]:text-[26px] sm:text-[34px] font-black italic tracking-wide leading-none pr-4 sm:pr-6">
                  ЖМЯК
                </span>

                {/* Overlapping white hand click icon on the right */}
                <span className="absolute -right-2 -bottom-2.5 sm:-right-3 sm:-bottom-3.5 pointer-events-none transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ClickHandIcon className="w-11 h-11 sm:w-14 sm:h-14" />
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
