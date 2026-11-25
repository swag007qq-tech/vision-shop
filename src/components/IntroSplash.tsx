import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';

interface IntroSplashProps {
  onDone?: () => void;
}

export function IntroSplash({onDone}: IntroSplashProps) {
  const [visible, setVisible] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImageReady(true);
      return;
    }

    // Safety fallback so splash never blocks the storefront on slow connections
    const fallbackTimer = window.setTimeout(() => {
      setImageReady(true);
    }, 1200);

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    if (!imageReady) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [imageReady]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="vision-intro-splash"
          aria-label="Заставка Vision shop"
          initial={{opacity: 1}}
          exit={{opacity: 0, transition: {duration: 0.35, ease: [0.16, 1, 0.3, 1]}}}
          style={{transform: 'translate3d(0, 0, 0)'}}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6 overflow-hidden"
        >
          <motion.div
            initial={prefersReducedMotion ? {opacity: 0} : {opacity: 0, scale: 0.9, y: 12}}
            animate={
              !imageReady
                ? {opacity: 0, scale: 0.94, y: 8}
                : prefersReducedMotion
                  ? {opacity: 1, transition: {duration: 0.3}}
                  : {
                      opacity: 1,
                      scale: 1,
                      y: [0, -14, 0, -10, 0],
                      rotate: [0, -1.6, 1.4, -0.8, 0],
                      transition: {
                        opacity: {duration: 0.32, ease: [0.16, 1, 0.3, 1]},
                        scale: {duration: 0.42, ease: [0.16, 1, 0.3, 1]},
                        y: {duration: 2, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.78, 1]},
                        rotate: {duration: 2, ease: 'easeInOut', times: [0, 0.25, 0.55, 0.8, 1]},
                      },
                    }
            }
            exit={
              prefersReducedMotion
                ? {opacity: 0, transition: {duration: 0.25}}
                : {opacity: 0, scale: 1.04, transition: {duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
            }
            className="w-full max-w-[290px] min-[420px]:max-w-[360px] sm:max-w-[440px] lg:max-w-[500px] flex items-center justify-center will-change-transform"
          >
            <img
              ref={imgRef}
              src="/assets/sprites/vision-logo.png"
              alt="Vision shop"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(true)}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain select-none pointer-events-none"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
