import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';

interface IntroSplashProps {
  onDone?: () => void;
}

export function IntroSplash({onDone}: IntroSplashProps) {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="vision-intro-splash"
          aria-label="Заставка Vision shop"
          initial={{opacity: 1}}
          exit={{opacity: 0, transition: {duration: 0.35, ease: [0.16, 1, 0.3, 1]}}}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6 overflow-hidden"
        >
          <motion.div
            initial={prefersReducedMotion ? {opacity: 0} : {opacity: 0, scale: 0.9, y: 12}}
            animate={
              prefersReducedMotion
                ? {opacity: 1, transition: {duration: 0.3}}
                : {
                    opacity: 1,
                    scale: 1,
                    y: [0, -14, 0, -10, 0],
                    rotate: [0, -1.6, 1.4, -0.8, 0],
                    transition: {
                      opacity: {duration: 0.35, ease: [0.16, 1, 0.3, 1]},
                      scale: {duration: 0.45, ease: [0.16, 1, 0.3, 1]},
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
            className="w-full max-w-[300px] min-[420px]:max-w-[380px] sm:max-w-[460px] lg:max-w-[520px] flex items-center justify-center"
          >
            <img
              src="/assets/aistudio/________Vision_shop________________2e05ce6d.png"
              alt="Vision shop"
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
