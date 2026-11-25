import React from 'react';
import {OutlineStarIcon, PawPrintIcon, SparkleIcon} from './VisionIllustrations';

export function BackgroundScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint',
      }}
      className="fixed top-0 left-0 w-full h-[100lvh] min-h-screen overflow-hidden pointer-events-none select-none z-0 bg-white"
    >
      {/* Exact corner ink blobs extracted from mockup */}
      <img
        src="/assets/sprites/corner-tl.png"
        alt=""
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute top-0 left-0 w-20 sm:w-28 lg:w-36 h-auto"
        draggable={false}
      />

      <img
        src="/assets/sprites/corner-tr.png"
        alt=""
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute top-0 right-0 w-24 sm:w-44 lg:w-64 h-auto"
        draggable={false}
      />

      <img
        src="/assets/sprites/corner-bl.png"
        alt=""
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute bottom-0 left-0 w-40 sm:w-64 lg:w-[340px] xl:w-[390px] h-auto"
        draggable={false}
      />

      <img
        src="/assets/sprites/corner-br.png"
        alt=""
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute bottom-0 right-0 w-44 sm:w-72 lg:w-[380px] xl:w-[440px] h-auto"
        draggable={false}
      />

      {/* Crisp monochrome mobile accents (< sm) matching desktop ink language without clutter */}
      <svg
        viewBox="0 0 360 72"
        className="sm:hidden absolute top-0 left-1/2 -translate-x-1/2 w-[210px] h-auto text-[#F1F1F1]"
        fill="currentColor"
      >
        <path d="M24 0H336C312 30 264 26 238 46C208 70 144 58 112 38C82 20 48 36 24 0Z" />
      </svg>

      <PawPrintIcon className="sm:hidden absolute top-6 right-[25%] w-6 h-6 text-[#141414] rotate-12" />
      <OutlineStarIcon className="sm:hidden absolute top-8 left-[32%] w-4 h-4 text-[#141414]" />
      <SparkleIcon className="sm:hidden absolute top-[218px] left-2.5 w-4 h-4 text-[#141414]" />
      <SparkleIcon className="sm:hidden absolute top-[210px] right-3 w-4 h-4 text-[#141414]" />
      <PawPrintIcon className="sm:hidden absolute top-[54%] left-2 w-5 h-5 text-[#141414] -rotate-12 opacity-90" />
      <SparkleIcon className="sm:hidden absolute bottom-16 right-[16%] w-4 h-4 text-[#141414]" />

      {/* Top soft grey decorative waves (tablet & desktop) */}
      <svg
        viewBox="0 0 600 180"
        className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/4 w-[380px] lg:w-[540px] h-auto text-[#ECECEC]"
        fill="currentColor"
      >
        <path d="M60 0H460C435 58 370 50 336 92C300 136 226 112 182 78C144 48 92 78 60 0Z" />
      </svg>

      {/* Mid-page horizon curve & left/right wave accents matching the screenshot */}
      <svg
        viewBox="0 0 1672 140"
        preserveAspectRatio="none"
        className="hidden md:block absolute top-[280px] lg:top-[285px] left-0 w-full h-24 lg:h-28"
        fill="none"
      >
        {/* Left black corner ink swell */}
        <path
          d="M0 12C54 24 102 64 162 86C116 98 54 100 0 120V12Z"
          fill="#141414"
        />
        {/* Right dark ridge under the peeking puppy */}
        <path
          d="M1110 86C1240 82 1340 34 1480 28C1560 25 1626 42 1672 56V96C1550 96 1350 94 1110 86Z"
          fill="#141414"
        />
        {/* Continuous curved horizon line across the canvas */}
        <path
          d="M0 78C380 100 1280 100 1672 78"
          stroke="#141414"
          strokeWidth="2.5"
        />
      </svg>

      {/* Side grey organic swells */}
      <svg
        viewBox="0 0 140 220"
        className="hidden lg:block absolute top-[54%] left-0 w-24 h-auto text-[#EAEAEA]"
        fill="currentColor"
      >
        <path d="M0 20C54 26 88 64 78 112C68 158 34 182 0 198V20Z" />
      </svg>

      {/* Scattered Paw Prints matching mockup positions */}
      <PawPrintIcon className="hidden md:block absolute top-8 right-[24%] w-9 h-9 lg:w-11 lg:h-11 text-[#141414] rotate-12" />

      {/* Scattered Sparkles & Stars matching mockup positions */}
      <SparkleIcon className="hidden lg:block absolute top-11 left-[53%] w-6 h-6 text-[#141414]" />
      <SparkleIcon className="hidden md:block absolute top-40 right-[21%] w-5 h-5 text-[#141414]" />
      <SparkleIcon className="hidden sm:block absolute bottom-11 left-[26%] w-6 h-6 text-[#141414]" />
      <SparkleIcon className="hidden sm:block absolute bottom-12 right-[23%] w-6 h-6 text-[#141414]" />
      <SparkleIcon className="hidden lg:block absolute top-[46%] left-6 w-5 h-5 text-[#141414]" />
      <SparkleIcon className="hidden lg:block absolute top-[45%] right-6 w-5 h-5 text-[#141414]" />
      <SparkleIcon className="hidden lg:block absolute top-[69%] left-6 w-5 h-5 text-[#141414]" />
      <SparkleIcon className="hidden lg:block absolute top-[78%] right-7 w-5 h-5 text-[#141414]" />
      <OutlineStarIcon className="hidden sm:block absolute top-10 left-[29%] w-6 h-6 text-[#141414]" />
    </div>
  );
}
