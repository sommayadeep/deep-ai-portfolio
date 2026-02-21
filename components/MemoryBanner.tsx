"use client";

import { useEffect, useState } from "react";

export default function MemoryBanner() {
  const [message, setMessage] = useState("Welcome. First neural sync in progress.");

  useEffect(() => {
    const key = "deep_ai_last_section";
    const last = localStorage.getItem(key);
    if (last) {
      setMessage(`Welcome back. Last time you viewed ${last}.`);
    }

    const onHashChange = () => {
      const section = window.location.hash.replace("#", "") || "Core Architecture";
      localStorage.setItem(key, section);
    };

    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="glass rounded-xl px-4 py-3 text-sm text-cyan-100">
      <span className="panel-title mr-2 text-[11px] text-cyan-200/70">Memory Layer</span>
      {message}
    </div>
  );
}
