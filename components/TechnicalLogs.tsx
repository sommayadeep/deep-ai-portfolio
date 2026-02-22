"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type LogEntry = {
  id: string;
  title: string;
  challenge: string;
  decision: string;
  outcome: string;
};

const logs: LogEntry[] = [
  {
    id: "turbofan-rul-prediction",
    title: "Turbofan RUL: Feature Stability Strategy",
    challenge: "Sensor channels in C-MAPSS showed drift and intermittent noise across units.",
    decision:
      "Used feature pruning + robust scaling + ensemble blending (Random Forest + HistGradientBoosting) to reduce sensitivity to noisy channels.",
    outcome: "MAE improved by 18% and noisy dimensions were reduced by 35% while preserving inference speed."
  },
  {
    id: "certitrust",
    title: "CertiTrust: On-chain Cost vs Verification Trust",
    challenge: "Needed tamper-proof verification without high gas costs or heavy on-chain payloads.",
    decision:
      "Stored only deterministic document hashes and critical metadata on-chain, while serving lookups via indexed API.",
    outcome: "Gas cost dropped by 19% and verification remained reliable at 99.9% integrity."
  }
];

export default function TechnicalLogs() {
  const [selected, setSelected] = useState<LogEntry | null>(null);

  return (
    <section id="technical-logs" className="glass rounded-2xl p-6">
      <p className="panel-title text-xs text-cyan-200/70">Technical Logs</p>
      <h2 className="mt-2 text-2xl text-white">Architectural Decisions From Top Projects</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {logs.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
            <h3 className="text-lg text-white">{entry.title}</h3>
            <p className="mt-2 text-sm text-blue-100">{entry.challenge}</p>
            <button
              className="ripple-btn mt-3 rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
              onClick={() => setSelected(entry)}
            >
              Open Technical Log
            </button>
          </article>
        ))}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040c]/85 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="glass w-full max-w-3xl rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl text-white">{selected.title}</h3>
                <button
                  className="ripple-btn rounded-md border border-cyan-200/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-blue-100">
                <p><span className="text-cyan-100">Challenge:</span> {selected.challenge}</p>
                <p><span className="text-cyan-100">Design Decision:</span> {selected.decision}</p>
                <p><span className="text-cyan-100">Result:</span> {selected.outcome}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
