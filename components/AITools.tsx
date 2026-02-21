"use client";

import { useState } from "react";
import { detectSentiment, estimateComplexity, scoreResume } from "@/lib/ai";

export default function AITools() {
  const [sentimentInput, setSentimentInput] = useState("");
  const [codeInput, setCodeInput] = useState("for (let i = 0; i < n; i++) {\n  // do work\n}");
  const [resumeInput, setResumeInput] = useState("");

  const sentiment = sentimentInput ? detectSentiment(sentimentInput) : "-";
  const complexity = estimateComplexity(codeInput);
  const resumeScore = resumeInput ? scoreResume(resumeInput) : null;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <ToolCard title="Sentiment Pulse" subtitle="Emotional Intelligence Mode">
        <textarea
          className="h-28 w-full rounded-lg border border-cyan-200/20 bg-[#09112b] p-3 text-sm outline-none focus:border-cyan-300/50"
          value={sentimentInput}
          onChange={(e) => setSentimentInput(e.target.value)}
          placeholder="Type a message..."
        />
        <p className="mt-3 text-sm text-cyan-100">Detected emotion: <span className="font-semibold text-white">{sentiment}</span></p>
      </ToolCard>

      <ToolCard title="Complexity Oracle" subtitle="Code Complexity Analyzer">
        <textarea
          className="h-28 w-full rounded-lg border border-cyan-200/20 bg-[#09112b] p-3 font-mono text-xs outline-none focus:border-cyan-300/50"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
        <p className="mt-3 text-sm text-cyan-100">{complexity}</p>
      </ToolCard>

      <ToolCard title="NeuralHire Analyzer" subtitle="Resume Analyzer">
        <textarea
          className="h-28 w-full rounded-lg border border-cyan-200/20 bg-[#09112b] p-3 text-sm outline-none focus:border-cyan-300/50"
          value={resumeInput}
          onChange={(e) => setResumeInput(e.target.value)}
          placeholder="Paste resume text..."
        />
        {resumeScore ? (
          <div className="mt-3 space-y-1 text-sm text-cyan-100">
            <p>
              Resume Score: <span className="font-semibold text-white">{resumeScore.score}/100</span>
            </p>
            {resumeScore.feedback.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-cyan-200/70">Paste content to run AI critique.</p>
        )}
      </ToolCard>
    </section>
  );
}

function ToolCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <article className="glass rounded-2xl p-4">
      <p className="panel-title text-[11px] text-cyan-200/70">{subtitle}</p>
      <h3 className="mt-1 text-lg text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </article>
  );
}
