"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BootSequence from "@/components/BootSequence";
import NeuralBackground from "@/components/NeuralBackground";
import MissionControl from "@/components/MissionControl";
import AITools from "@/components/AITools";
import AIAssistant from "@/components/AIAssistant";
import MemoryBanner from "@/components/MemoryBanner";
import EngineeringProof from "@/components/EngineeringProof";
import TechnicalLogs from "@/components/TechnicalLogs";
import NeuralFeedback from "@/components/NeuralFeedback";
import { profile } from "@/data/profile";

type Tone = "neutral" | "motivated" | "curious" | "stressed";

export default function HomePage() {
  const [bootDone, setBootDone] = useState(false);
  const [tone, setTone] = useState<Tone>("neutral");
  const [activeSection, setActiveSection] = useState("core-architecture");
  const [cursor, setCursor] = useState({ x: 420, y: 220 });
  const [allowPointerEffects, setAllowPointerEffects] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);
  const reduceMotion = useReducedMotion();

  const nav = useMemo(
    () => [
      ["Core Architecture", "core-architecture"],
      ["AI Tools", "ai-tools"],
      ["Engineering Proof", "engineering-proof"],
      ["Technical Logs", "technical-logs"],
      ["AI Deployments", "ai-deployments"],
      ["Neural Feedback", "neural-feedback"],
      ["Connect Protocol", "connect-protocol"]
    ],
    []
  );

  const sectionOrder = nav.map(([, id]) => id);
  const signalLevel = Math.max(1, sectionOrder.indexOf(activeSection) + 1);

  useEffect(() => {
    document.documentElement.setAttribute("data-tone", tone);
  }, [tone]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      setCursor({ x: event.clientX, y: event.clientY });
    };

    if (reduceMotion || !allowPointerEffects) return;
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [allowPointerEffects, reduceMotion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    setAllowPointerEffects(!(coarse || narrow));
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onZoomSignal = () => {
      setIsZooming(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsZooming(false), 220);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) onZoomSignal();
    };

    const vv = window.visualViewport;
    const onViewportChange = () => {
      if (!vv) return;
      setViewportScale(vv.scale || 1);
      onZoomSignal();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    vv?.addEventListener("resize", onViewportChange);
    vv?.addEventListener("scroll", onViewportChange);
    return () => {
      window.removeEventListener("wheel", onWheel);
      vv?.removeEventListener("resize", onViewportChange);
      vv?.removeEventListener("scroll", onViewportChange);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.35 }
    );

    sectionOrder.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionOrder]);

  const effectsEnabled = allowPointerEffects && !reduceMotion && !isZooming && Math.abs(viewportScale - 1) < 0.001;
  const parallaxX = effectsEnabled ? `${(cursor.x / 130) * -1 + 5}px` : "0px";
  const parallaxY = effectsEnabled ? `${(cursor.y / 160) * -1 + 5}px` : "0px";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-grid-glow px-4 pb-24 pt-6 text-blue-50 md:px-10">
      {!bootDone ? <BootSequence onDone={() => setBootDone(true)} /> : null}
      {effectsEnabled ? (
        <div className="cursor-glow" style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }} />
      ) : null}
      <NeuralBackground signalLevel={signalLevel} reducedEffects={!effectsEnabled} />

      <div className="mx-auto max-w-6xl space-y-6 parallax-layer" style={{ ["--parallax-x" as string]: parallaxX, ["--parallax-y" as string]: parallaxY }}>
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-6"
          id="core-architecture"
        >
          <p className="panel-title text-xs text-cyan-200">DEEP.AI v5.0</p>
          <h1 className="mt-2 text-3xl text-white md:text-5xl">The Mind of Sommayadeep</h1>
          <p className="mt-2 text-lg text-cyan-100 md:text-2xl">{profile.title}</p>
          <p className="text-sm text-cyan-200/90 md:text-base">{profile.subtitle}</p>
          <p className="mt-1 text-sm text-cyan-100">{profile.brandLine}</p>
          <p className="mt-3 max-w-3xl text-sm text-blue-100 md:text-base">{profile.summary}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {profile.authoritySignals.map((signal) => (
              <span key={signal} className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                {signal}
              </span>
            ))}
          </div>

          <nav className="mt-5 flex flex-wrap gap-2">
            {nav.map(([label, hash]) => (
              <a
                key={hash}
                href={`#${hash}`}
                className="ripple-btn rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-widest text-cyan-100"
              >
                {label}
              </a>
            ))}
          </nav>
        </motion.header>

        <MemoryBanner />
        <MissionControl />
        <AITools onToneChange={setTone} />

        <EngineeringProof />
        <TechnicalLogs />

        <motion.section
          id="technical-modules"
          className="grid gap-4 md:grid-cols-2"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
        >
          {profile.modules.map((module) => (
            <article key={module.title} className="glass magnetic rounded-2xl p-5">
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
        </motion.section>

        <motion.section
          id="ai-deployments"
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <p className="panel-title text-xs text-cyan-200/70">AI Deployments</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {profile.deployments.map((project, index) => (
              <motion.article
                key={project.name}
                data-project-key={toProjectKey(project.name)}
                className="magnetic rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <p className="text-xs uppercase tracking-widest text-cyan-200/70">{project.type}</p>
                <h3 className="mt-1 text-lg text-white">{project.name}</h3>
                <p className="mt-2 text-sm text-blue-100">{project.impact}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.metrics.slice(0, 2).map((metric) => (
                    <span key={metric} className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-100">
                      {metric}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <a
                    className="ripple-btn rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100"
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub Repo
                  </a>
                  {project.liveUrl ? (
                    <a
                      className="ripple-btn rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100"
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
              </motion.article>
            ))}
          </div>
        </motion.section>

        <NeuralFeedback />

        <section id="connect-protocol" className="glass rounded-2xl p-6">
          <p className="panel-title text-xs text-cyan-200/70">Connect Protocol</p>
          <h2 className="mt-2 text-2xl text-white">Initiate Collaboration Request</h2>
          <p className="mt-3 text-sm text-blue-100">POST /connect with your problem statement. Expected response: production-grade AI engineering.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <a className="ripple-btn rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-2" href="mailto:sommayadeepsaha@gmail.com">Email Node</a>
            <a className="ripple-btn rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-2" href="https://github.com/sommayadeep" target="_blank" rel="noreferrer">GitHub Node</a>
            <a className="ripple-btn rounded-md border border-cyan-200/20 bg-cyan-400/10 px-3 py-2" href="https://www.linkedin.com/in/sommayadeep-saha-127baa335/" target="_blank" rel="noreferrer">LinkedIn Node</a>
          </div>
        </section>
      </div>

      <AIAssistant />
    </main>
  );
}

function toProjectKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
