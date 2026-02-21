"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import BootSequence from "@/components/BootSequence";
import NeuralBackground from "@/components/NeuralBackground";
import MissionControl from "@/components/MissionControl";
import AITools from "@/components/AITools";
import AIAssistant from "@/components/AIAssistant";
import MemoryBanner from "@/components/MemoryBanner";
import { profile } from "@/data/profile";

export default function HomePage() {
  const [bootDone, setBootDone] = useState(false);

  const nav = useMemo(
    () => [
      ["Core Architecture", "core-architecture"],
      ["Technical Modules", "technical-modules"],
      ["AI Deployments", "ai-deployments"],
      ["Connect Protocol", "connect-protocol"]
    ],
    []
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-grid-glow px-4 pb-24 pt-6 text-blue-50 md:px-10">
      {!bootDone ? <BootSequence onDone={() => setBootDone(true)} /> : null}
      <NeuralBackground />

      <div className="mx-auto max-w-6xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <p className="panel-title text-xs text-cyan-200">DEEP.AI v4.0</p>
          <h1 className="mt-2 text-3xl text-white md:text-5xl">The Mind of Sommayadeep</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-100 md:text-base">{profile.summary}</p>
          <p className="mt-1 text-sm text-cyan-100/85">{profile.title}</p>
          <nav className="mt-5 flex flex-wrap gap-2">
            {nav.map(([label, hash]) => (
              <a
                key={hash}
                href={`#${hash}`}
                className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-widest text-cyan-100"
              >
                {label}
              </a>
            ))}
          </nav>
        </motion.header>

        <MemoryBanner />
        <MissionControl />
        <AITools />

        <section id="core-architecture" className="glass rounded-2xl p-6">
          <p className="panel-title text-xs text-cyan-200/70">Core Architecture</p>
          <h2 className="mt-2 text-2xl text-white">Human Intelligence, Engineered as Systems</h2>
          <p className="mt-3 text-blue-100">
            This portfolio models technical identity as a living AI system: data-driven learning loops, production
            deployment mindset, and applied experimentation in ML + software engineering.
          </p>
        </section>

        <section id="technical-modules" className="grid gap-4 md:grid-cols-2">
          {profile.modules.map((module) => (
            <article key={module.title} className="glass rounded-2xl p-5">
              <p className="panel-title text-xs text-cyan-200/70">Technical Modules</p>
              <h3 className="mt-1 text-xl text-white">{module.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {module.items.map((item) => (
                  <span key={item} className="rounded-full border border-cyan-200/20 bg-[#0a1230] px-3 py-1 text-xs text-cyan-100">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section id="ai-deployments" className="glass rounded-2xl p-6">
          <p className="panel-title text-xs text-cyan-200/70">AI Deployments</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {profile.deployments.map((project) => (
              <article key={project.name} className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-200/70">{project.type}</p>
                <h3 className="mt-1 text-lg text-white">{project.name}</h3>
                <p className="mt-2 text-sm text-blue-100">{project.impact}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <a
                    className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100"
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub Repo
                  </a>
                  {project.liveUrl ? (
                    <a
                      className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100"
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Live Link
                    </a>
                  ) : (
                    <span className="rounded-md border border-cyan-200/20 bg-[#0a1230] px-3 py-1.5 text-cyan-200/65">
                      Live: Not Deployed Yet
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="connect-protocol" className="glass rounded-2xl p-6">
          <p className="panel-title text-xs text-cyan-200/70">Connect Protocol</p>
          <h2 className="mt-2 text-2xl text-white">Initiate Collaboration Request</h2>
          <p className="mt-3 text-sm text-blue-100">POST /connect with your problem statement. Expected response: production-grade AI engineering.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <a className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-2" href="mailto:sommayadeep@example.com">Email Node</a>
            <a className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-2" href="https://github.com/sommayadeep" target="_blank" rel="noreferrer">GitHub Node</a>
            <a className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-2" href="https://www.linkedin.com/in/sommayadeep-saha-127baa335/" target="_blank" rel="noreferrer">LinkedIn Node</a>
          </div>
        </section>
      </div>

      <AIAssistant />
    </main>
  );
}
