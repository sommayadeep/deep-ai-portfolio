"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";

type Stats = {
  repoCount: number;
  projectCount: number;
  followers: number;
};

export default function MissionControl() {
  const [stats, setStats] = useState<Stats>({
    repoCount: 0,
    projectCount: profile.deployments.length,
    followers: 0
  });

  useEffect(() => {
    const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "sommayadeep";

    fetch(`/api/github-stats?username=${username}`)
      .then((r) => r.json())
      .then((d) => {
        setStats((prev) => ({
          ...prev,
          repoCount: typeof d.repoCount === "number" ? d.repoCount : prev.repoCount,
          followers: typeof d.followers === "number" ? d.followers : prev.followers
        }));
      })
      .catch(() => {
        // Keep fallback values when API call fails.
      });
  }, []);

  return (
    <section className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg text-cyan-100">Mission Control Dashboard</h2>
        <span className="text-xs uppercase tracking-widest text-cyan-200/75">Live Metrics</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Metric label="CGPA" value={`${profile.cgpa.toFixed(1)} / 10`} progress={profile.cgpa * 10} />
        <Metric label="GitHub Repositories" value={`${stats.repoCount}`} progress={Math.min(stats.repoCount, 100)} />
        <Metric label="Projects Deployed" value={`${stats.projectCount}`} progress={Math.min(stats.projectCount * 20, 100)} />
        <Metric label="GitHub Followers" value={`${stats.followers}`} progress={Math.min(stats.followers * 10, 100)} />
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
