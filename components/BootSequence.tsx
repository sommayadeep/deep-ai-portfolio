"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const lines = [
  "Initializing DEEP.AI v4.0",
  "Loading Neural Parameters...",
  "Authenticating Visitor...",
  "Access Granted.",
  "Welcome to Sommayadeep's AI System."
];

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleLines(lines.length);
      const doneTimer = setTimeout(onDone, 120);
      return () => clearTimeout(doneTimer);
    }

    if (visibleLines < lines.length) {
      const timer = setTimeout(() => setVisibleLines((v) => v + 1), 550);
      return () => clearTimeout(timer);
    }

    const doneTimer = setTimeout(onDone, 900);
    return () => clearTimeout(doneTimer);
  }, [onDone, reduceMotion, visibleLines]);

  return (
    <AnimatePresence>
      <motion.div
        key="boot"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6 } }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040a]"
      >
        <div className="relative w-[92%] max-w-3xl rounded-xl border border-cyan-300/25 bg-black/60 p-8 text-cyan-200 shadow-neon">
          <div className="scanline" />
          <p className="mb-4 text-xs tracking-[0.35em] text-cyan-100/70">SYSTEM BOOT TERMINAL</p>
          <div className="space-y-2 font-mono text-sm md:text-base">
            {lines.slice(0, visibleLines).map((line) => (
              <p key={line} className="animate-boot">
                &gt; {line}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
