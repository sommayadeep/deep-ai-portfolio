"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";

type Stats = {
  repoCount: number | null;
  projectCount: number;
  followers: number | null;
  contributions30d: number | null;
  source: "github" | "fallback" | "loading";
  lastSync: string | null;
};

type Health = {
  latencyMs: number | null;
  apiUp: boolean | null;
};

function currentWorkStatus(now: Date) {
  const hour = now.getHours();
  if (hour >= 22 || hour < 7) return "Deep Work Mode";
  return "Available for Hire";
}

export default function MissionControl() {
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<Stats>({
    repoCount: null,
    projectCount: profile.deployments.length,
    followers: null,
    contributions30d: null,
    source: "loading",
    lastSync: null
  });
  const [clock, setClock] = useState(() => new Date());
  const [health, setHealth] = useState<Health>({ latencyMs: null, apiUp: null });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "sommayadeep";

    fetch(`/api/github-stats?username=${username}`)
      .then((r) => r.json())
      .then((d) => {
        setStats((prev) => ({
          ...prev,
          repoCount: typeof d.repoCount === "number" ? d.repoCount : prev.repoCount,
          followers: typeof d.followers === "number" ? d.followers : prev.followers,
          contributions30d: typeof d.contributions30d === "number" ? d.contributions30d : prev.contributions30d,
          source: d.source === "github" ? "github" : "fallback",
          lastSync: new Date().toISOString()
        }));
      })
      .catch(() => {
        setStats((prev) => ({ ...prev, source: "fallback", lastSync: new Date().toISOString() }));
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const check = async () => {
      const start = performance.now();
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const end = performance.now();
        setHealth({
          apiUp: response.ok,
          latencyMs: Math.round(end - start)
        });
      } catch {
        setHealth({ apiUp: false, latencyMs: null });
      }
    };

    void check();
    const timer = setInterval(() => void check(), 20000);
    return () => clearInterval(timer);
  }, []);

  const status = isMounted ? currentWorkStatus(clock) : "Syncing...";
  const timeString = isMounted
    ? clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  return (
    <section id="mission-control" className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg text-cyan-100">Mission Control Dashboard</h2>
        <span className="text-xs uppercase tracking-widest text-cyan-200/75">Live Metrics + Proof of Life</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Metric label="CGPA" value={`${profile.cgpa.toFixed(1)} / 10`} progress={profile.cgpa * 10} />
        <Metric
          label="GitHub Repositories"
          value={stats.repoCount === null ? "Syncing..." : `${stats.repoCount}`}
          progress={Math.min(Math.max(stats.repoCount ?? 0, 10), 100)}
        />
        <Metric label="Projects Deployed" value={`${stats.projectCount}`} progress={Math.min(stats.projectCount * 20, 100)} />
        <Metric
          label="GitHub Followers"
          value={stats.followers === null ? "Syncing..." : `${stats.followers}`}
          progress={Math.min(Math.max((stats.followers ?? 0) * 4, 10), 100)}
        />
        <Metric
          label="GitHub Contributions (Recent)"
          value={stats.contributions30d === null ? "Syncing..." : `${stats.contributions30d} events`}
          progress={Math.min(Math.max((stats.contributions30d ?? 0) * 3, 10), 100)}
        />
        <Metric label="System Status" value={status} progress={status === "Available for Hire" ? 92 : 75} />
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-cyan-200/15 bg-[#0a1230]/70 p-4 text-xs text-cyan-100 md:grid-cols-3">
        <p>
          Local Time: <span className="text-white">{timeString}</span>
        </p>
        <p>
          API Health:{" "}
          <span className={health.apiUp === false ? "text-red-300" : "text-emerald-300"}>
            {health.apiUp === null ? "Checking..." : health.apiUp ? "Online" : "Offline"}
          </span>
          {health.latencyMs !== null ? ` (${health.latencyMs}ms)` : ""}
        </p>
        <p>
          GitHub Sync: <span className="text-white">{stats.source === "loading" ? "Loading..." : stats.source}</span>
          {stats.lastSync ? ` at ${new Date(stats.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="rounded-xl border border-cyan-200/15 bg-[#0a1230]/80 p-4">
      <p className="panel-title text-[11px] text-cyan-200/80">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-cyan-100/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
