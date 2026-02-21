"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/data/profile";

type Proof = (typeof profile.engineeringProof)[number];

export default function EngineeringProof() {
  const [selected, setSelected] = useState<Proof | null>(null);
  const topProjects = useMemo(() => profile.engineeringProof.slice(0, 3), []);

  return (
    <section id="engineering-proof" className="space-y-4">
      <article className="glass rounded-2xl p-6">
        <p className="panel-title text-xs text-cyan-200/70">Engineering Proof</p>
        <h2 className="mt-2 text-2xl text-white">Architecture Diagrams and System Tradeoffs</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {topProjects.map((project) => (
            <button
              key={project.name}
              onClick={() => setSelected(project)}
              className="magnetic rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4 text-left"
            >
              <p className="text-xs uppercase tracking-widest text-cyan-200/70">System Design</p>
              <h3 className="mt-1 text-lg text-white">{project.name}</h3>
              <p className="mt-2 text-sm text-blue-100">{project.problem}</p>
              <p className="mt-3 text-xs text-cyan-100">Open architecture modal -&gt;</p>
            </button>
          ))}
        </div>
      </article>

      <article className="glass rounded-2xl p-6">
        <p className="panel-title text-xs text-cyan-200/70">Challenges Solved</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {topProjects.map((project) => (
            <div key={project.name} className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
              <h3 className="text-base text-white">{project.name}</h3>
              <p className="mt-2 text-sm text-blue-100"><span className="text-cyan-100">Problem:</span> {project.problem}</p>
              <p className="mt-2 text-sm text-blue-100"><span className="text-cyan-100">Challenge:</span> {project.challenge}</p>
              <p className="mt-2 text-sm text-blue-100"><span className="text-cyan-100">Solved:</span> {project.solution}</p>
              <p className="mt-2 text-sm text-blue-100"><span className="text-cyan-100">Tradeoff:</span> {project.tradeoff}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="glass rounded-2xl p-6">
        <p className="panel-title text-xs text-cyan-200/70">Deployment Authority</p>
        <h2 className="mt-2 text-2xl text-white">Architecture, CI/CD, and Benchmark Signals</h2>
        <p className="mt-2 text-xs text-cyan-200/80">Benchmark values below are simulated for demonstration clarity.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-200/70">Deployment Architecture</p>
            <svg viewBox="0 0 560 180" className="mt-3 h-40 w-full">
              <rect x="12" y="56" width="118" height="50" rx="10" fill="#11234d" stroke="#59f6ff" strokeOpacity="0.65" />
              <text x="71" y="84" textAnchor="middle" fontSize="11" fill="#d8f8ff">Client</text>
              <rect x="162" y="56" width="118" height="50" rx="10" fill="#11234d" stroke="#59f6ff" strokeOpacity="0.65" />
              <text x="221" y="84" textAnchor="middle" fontSize="11" fill="#d8f8ff">API Layer</text>
              <rect x="312" y="56" width="118" height="50" rx="10" fill="#11234d" stroke="#59f6ff" strokeOpacity="0.65" />
              <text x="371" y="84" textAnchor="middle" fontSize="11" fill="#d8f8ff">Services</text>
              <rect x="462" y="56" width="86" height="50" rx="10" fill="#11234d" stroke="#59f6ff" strokeOpacity="0.65" />
              <text x="505" y="84" textAnchor="middle" fontSize="11" fill="#d8f8ff">Storage</text>
              <line x1="130" y1="81" x2="162" y2="81" stroke="#59f6ff" strokeWidth="2" />
              <line x1="280" y1="81" x2="312" y2="81" stroke="#59f6ff" strokeWidth="2" />
              <line x1="430" y1="81" x2="462" y2="81" stroke="#59f6ff" strokeWidth="2" />
            </svg>
          </div>

          <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-200/70">CI/CD Flow</p>
            <ol className="mt-2 space-y-1 text-sm text-blue-100">
              <li>1. Commit + Pull Request</li>
              <li>2. Type Check + Lint + Build Validation</li>
              <li>3. Preview Deployment + Smoke Checks</li>
              <li>4. Main Branch Merge</li>
              <li>5. Production Deploy + Health Monitoring</li>
            </ol>
            <p className="mt-4 text-xs uppercase tracking-widest text-cyan-200/70">Simulated Benchmarks</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-cyan-100">
              <span className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1">p95 API Latency: 182ms</span>
              <span className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1">p99 API Latency: 311ms</span>
              <span className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1">Throughput: 520 req/min</span>
              <span className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1">Error Rate: 0.32%</span>
              <span className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1">Stress Test: 3.2k VUs</span>
              <span className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1">Availability: 99.9%</span>
            </div>
          </div>
        </div>
      </article>

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
              className="glass max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="panel-title text-xs text-cyan-200/70">Architecture Detail</p>
                  <h3 className="mt-1 text-xl text-white">{selected.name}</h3>
                </div>
                <button className="ripple-btn rounded-md border border-cyan-200/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
                  <p className="text-xs uppercase tracking-widest text-cyan-200/70">System Design Diagram</p>
                  <ArchitectureSvg steps={selected.apiFlow} />
                </div>

                <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4 text-sm text-blue-100">
                  <p className="text-xs uppercase tracking-widest text-cyan-200/70">API Flow</p>
                  <ul className="mt-2 space-y-1">
                    {selected.apiFlow.map((step) => (
                      <li key={step}>- {step}</li>
                    ))}
                  </ul>

                  <p className="mt-4 text-xs uppercase tracking-widest text-cyan-200/70">Database Schema Snippet</p>
                  <code className="mt-2 block rounded-md bg-black/30 p-2 text-xs text-cyan-100">{selected.schema}</code>

                  <p className="mt-4 text-xs uppercase tracking-widest text-cyan-200/70">ML/Data Pipeline</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {selected.pipeline.map((step) => (
                      <span key={step} className="rounded-full border border-cyan-200/20 bg-[#0e193d] px-2 py-1 text-cyan-100">{step}</span>
                    ))}
                  </div>

                  <p className="mt-4 text-xs uppercase tracking-widest text-cyan-200/70">Metrics</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {selected.metrics.map((metric) => (
                      <span key={metric} className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-2 py-1 text-cyan-100">{metric}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function ArchitectureSvg({ steps }: { steps: string[] }) {
  return (
    <svg viewBox="0 0 640 180" className="mt-3 h-44 w-full">
      {steps.map((step, idx) => {
        const x = 20 + idx * 150;
        return (
          <g key={step}>
            <rect x={x} y={50} width="120" height="56" rx="10" fill="#132452" stroke="#59f6ff" strokeOpacity="0.6" />
            <text x={x + 60} y={84} textAnchor="middle" fontSize="11" fill="#d7f8ff">{shorten(step)}</text>
            {idx < steps.length - 1 ? <line x1={x + 120} y1={78} x2={x + 150} y2={78} stroke="#59f6ff" strokeWidth="2" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

function shorten(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 14)}..`;
}
