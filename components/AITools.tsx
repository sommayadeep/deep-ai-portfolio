"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeSentiment, explainComplexity, scoreResume } from "@/lib/ai";
import ASTVisualizer from "@/components/ASTVisualizer";

type Tone = "neutral" | "motivated" | "curious" | "stressed";

export default function AITools({ onToneChange }: { onToneChange: (tone: Tone) => void }) {
  const [sentimentInput, setSentimentInput] = useState("");
  const [codeInput, setCodeInput] = useState("for (let i = 0; i < n; i++) {\n  // do work\n}");
  const [resumeInput, setResumeInput] = useState("");
  const [transparencyTool, setTransparencyTool] = useState<"sentiment" | "complexity" | "resume">("sentiment");
  const [simulationRun, setSimulationRun] = useState(1);
  const [openSnippet, setOpenSnippet] = useState<null | "sentiment" | "complexity" | "resume">(null);

  const sentimentAnalysis = useMemo(
    () => (sentimentInput ? analyzeSentiment(sentimentInput) : null),
    [sentimentInput]
  );
  const sentiment = sentimentAnalysis?.label ?? "-";
  const complexity = useMemo(() => explainComplexity(codeInput), [codeInput]);
  const resumeScore = resumeInput ? scoreResume(resumeInput) : null;
  const simulationSeed = useMemo(() => {
    const source = [
      transparencyTool,
      sentimentInput,
      codeInput,
      resumeInput,
      String(resumeScore?.score ?? 0),
      String(simulationRun)
    ].join("|");
    return hashText(source);
  }, [codeInput, resumeInput, resumeScore?.score, sentimentInput, simulationRun, transparencyTool]);

  useEffect(() => {
    if (!sentimentInput.trim()) {
      onToneChange("neutral");
      return;
    }

    if (sentimentAnalysis?.label === "Motivated") onToneChange("motivated");
    else if (sentimentAnalysis?.label === "Curious") onToneChange("curious");
    else if (sentimentAnalysis?.label === "Stressed") onToneChange("stressed");
    else onToneChange("neutral");
  }, [onToneChange, sentimentAnalysis, sentimentInput]);

  useEffect(() => {
    const onSnippet = (event: Event) => {
      const custom = event as CustomEvent<{ snippetId?: "sentiment" | "complexity" | "resume" }>;
      const id = custom.detail?.snippetId;
      if (id) setOpenSnippet(id);
    };
    window.addEventListener("assistant-open-snippet", onSnippet as EventListener);
    return () => window.removeEventListener("assistant-open-snippet", onSnippet as EventListener);
  }, []);

  const transparency = {
    sentiment: {
      algorithm: "Lexicon-Weighted Rule Classifier",
      complexity: "O(n) token scan",
      io: [
        "Input: 'I am stuck with deployment and worried'",
        "Output: Stressed",
        "Confidence: 79%"
      ],
      confidence: 79,
      featureImportance: [
        ["Negative phrase intensity", 88],
        ["Emotion token match", 74],
        ["Contextual intent cues", 65]
      ]
    },
    complexity: {
      algorithm: "Static Pattern Analyzer",
      complexity: `${complexity.timeComplexity} estimated`,
      io: [
        "Input: nested loops + sort",
        `Output: ${complexity.timeComplexity}`,
        `Confidence: ${complexity.confidence}%`
      ],
      confidence: complexity.confidence,
      featureImportance: [
        ["Loop depth", 90],
        ["Recursion signal", 70],
        ["Sorting primitive", 76]
      ]
    },
    resume: {
      algorithm: "Heuristic Resume Scoring Engine",
      complexity: "O(n) section scan",
      io: [
        "Input: resume bullets with metrics",
        `Output: ${resumeScore?.score ?? 55}/100`,
        "Confidence: 73%"
      ],
      confidence: 73,
      featureImportance: [
        ["Quantified outcomes", 84],
        ["Action-oriented bullets", 79],
        ["AI keyword alignment", 68]
      ]
    }
  } as const;

  const active = transparency[transparencyTool];

  return (
    <section id="ai-tools" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <ToolCard title="Sentiment Pulse" subtitle="Emotional Intelligence Mode">
          <textarea
            className="h-28 w-full rounded-lg border border-cyan-200/20 bg-[#09112b] p-3 text-sm outline-none focus:border-cyan-300/50"
            value={sentimentInput}
            onChange={(e) => setSentimentInput(e.target.value)}
            placeholder="Type a message..."
          />
          <p className="mt-3 text-sm text-cyan-100">
            Detected emotion: <span className="font-semibold text-white">{sentiment}</span>
          </p>
          {sentimentAnalysis ? (
            <div className="mt-3 space-y-1 text-xs text-cyan-200/85">
              <p>
                Confidence: <span className="text-white">{sentimentAnalysis.confidence}%</span>
              </p>
              <p>
                Valence score: <span className="text-white">{sentimentAnalysis.score}</span>
              </p>
              <p>
                Tone type: <span className="text-white">{sentimentAnalysis.toneType}</span>
              </p>
              <p>
                Emotional intensity: <span className="text-white">{sentimentAnalysis.emotionalIntensity}</span>
              </p>
              <p>
                Professional assertiveness: <span className="text-white">{sentimentAnalysis.professionalAssertiveness}%</span>
              </p>
              <p>{sentimentAnalysis.review}</p>
              {sentimentAnalysis.signals.length > 0 ? (
                <p className="text-cyan-300/85">Signals: {sentimentAnalysis.signals.join(", ")}</p>
              ) : null}
            </div>
          ) : null}
        </ToolCard>

        <ToolCard title="Complexity Oracle" subtitle="Static Analysis Engine">
          <textarea
            className="h-28 w-full rounded-lg border border-cyan-200/20 bg-[#09112b] p-3 font-mono text-xs outline-none focus:border-cyan-300/50"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />
          <p className="mt-3 text-sm text-cyan-100">Time: {complexity.timeComplexity}</p>
          <p className="text-sm text-cyan-100">Space: {complexity.spaceComplexity}</p>
          <ul className="mt-2 space-y-1 text-xs text-cyan-200/80">
            {complexity.reasoning.slice(0, 4).map((point) => (
              <li key={point}>- {point}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-cyan-200/70">Detailed symbolic reasoning and AST graph are shown below.</p>
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
                <p key={item}>- {item}</p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-cyan-200/70">Paste content to run AI critique.</p>
          )}
        </ToolCard>
      </div>

      <article className="glass rounded-2xl p-5">
        <p className="panel-title text-xs text-cyan-200/70">Complexity Intelligence Engine</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-cyan-200/20 bg-[#0d1738]/80 p-4">
            <p className="text-[11px] uppercase tracking-widest text-cyan-200/75">AI Reasoning Trace</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-100">
              {complexity.derivation.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-md border border-cyan-200/20 bg-[#101d45] p-2 text-xs text-cyan-100">
              Final complexity: <span className="font-semibold text-white">{complexity.timeComplexity}</span>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/80 p-2">
            <ASTVisualizer code={codeInput} />
          </div>
        </div>
      </article>

      <article className="glass rounded-2xl p-5">
        <p className="panel-title text-xs text-cyan-200/70">Model Transparency Panel</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button className={tabClass(transparencyTool === "sentiment")} onClick={() => setTransparencyTool("sentiment")}>Sentiment Tool</button>
          <button className={tabClass(transparencyTool === "complexity")} onClick={() => setTransparencyTool("complexity")}>Complexity Tool</button>
          <button className={tabClass(transparencyTool === "resume")} onClick={() => setTransparencyTool("resume")}>Resume Tool</button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/80 p-4 text-sm text-blue-100">
            <p className="text-xs uppercase tracking-widest text-cyan-200/70">Method</p>
            <p className="mt-1 text-white">{active.algorithm}</p>
            <p className="mt-3 text-xs uppercase tracking-widest text-cyan-200/70">Complexity</p>
            <p className="mt-1">{active.complexity}</p>
            <p className="mt-3 text-xs uppercase tracking-widest text-cyan-200/70">Example I/O</p>
            <ul className="mt-1 space-y-1 text-xs">
              {active.io.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs uppercase tracking-widest text-cyan-200/70">Confidence Score</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-100/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${active.confidence}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/80 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-200/70">Feature Importance</p>
            <div className="mt-2 space-y-3 text-xs text-blue-100">
              {active.featureImportance.map(([feature, score]) => (
                <div key={feature}>
                  <div className="mb-1 flex justify-between">
                    <span>{feature}</span>
                    <span>{score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cyan-100/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/80 to-indigo-400/80" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-200/20 bg-[#0a1230]/80 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-widest text-cyan-200/70">Live ML Visualization</p>
            <button
              className="ripple-btn rounded-full border border-cyan-200/20 bg-[#0d1738] px-2.5 py-1 text-[10px] uppercase tracking-wider text-cyan-100"
              onClick={() => setSimulationRun((prev) => prev + 1)}
            >
              Re-run
            </button>
          </div>
          <p className="mt-1 text-sm text-blue-100">Simulated training loss convergence curve (live).</p>
          <LiveMLVisualization tool={transparencyTool} seed={simulationSeed} />
        </div>
      </article>

      {openSnippet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040c]/85 p-4" onClick={() => setOpenSnippet(null)}>
          <div className="glass w-full max-w-3xl rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="panel-title text-xs text-cyan-200/70">Proof of Action: {openSnippet} logic</p>
              <button
                className="ripple-btn rounded-md border border-cyan-200/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                onClick={() => setOpenSnippet(null)}
              >
                Close
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-cyan-200/15 bg-[#08102a] p-4 text-xs text-cyan-100">
{snippetText(openSnippet)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function snippetText(snippet: "sentiment" | "complexity" | "resume") {
  if (snippet === "sentiment") {
    return `// Sentiment pulse (abridged)\nconst analysis = analyzeSentiment(input);\n// returns: label, confidence, score, toneType, emotionalIntensity, professionalAssertiveness`;
  }
  if (snippet === "complexity") {
    return `// Complexity oracle (abridged)\nconst result = explainComplexity(code);\n// returns: timeComplexity, spaceComplexity, reasoning, derivation`;
  }
  return `// Resume analyzer (abridged)\nconst report = scoreResume(resumeText);\n// returns: score + actionable reviewer feedback`;
}

function ToolCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <article className="glass magnetic h-full rounded-2xl p-5">
      <p className="panel-title text-[11px] text-cyan-200/70">{subtitle}</p>
      <h3 className="mt-1 text-lg text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function tabClass(active: boolean) {
  return active
    ? "rounded-full border border-cyan-200/40 bg-cyan-400/20 px-3 py-1.5 text-cyan-100"
    : "rounded-full border border-cyan-200/20 bg-[#0a1230] px-3 py-1.5 text-cyan-200/80";
}

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 99991;
  }
  return hash;
}

function LiveMLVisualization({ tool, seed }: { tool: "sentiment" | "complexity" | "resume"; seed: number }) {
  const maxEpochs = 40;
  const [epoch, setEpoch] = useState(1);

  useEffect(() => {
    setEpoch(1);
    const timer = setInterval(() => {
      setEpoch((prev) => (prev >= maxEpochs ? 1 : prev + 1));
    }, 520);
    return () => clearInterval(timer);
  }, [seed, tool]);

  const { trainPath, valPath, trainCurrent, valCurrent, profileLabel } = useMemo(
    () => buildLiveCurves({ epoch, maxEpochs, seed, tool }),
    [epoch, maxEpochs, seed, tool]
  );

  return (
    <>
      <svg viewBox="0 0 420 130" className="mt-3 h-36 w-full">
        <path d="M24 16 V112 H406" stroke="#31406f" strokeWidth="1" fill="none" />
        <path d={trainPath} fill="none" stroke="#22d3ee" strokeWidth="3" />
        <path d={valPath} fill="none" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-cyan-100">
        <p>Epoch: {epoch}/{maxEpochs}</p>
        <p>Train loss: {trainCurrent.toFixed(3)}</p>
        <p>Val loss: {valCurrent.toFixed(3)}</p>
      </div>
      <p className="mt-1 text-[11px] text-cyan-200/80">Run profile: {profileLabel}</p>
    </>
  );
}

function buildLiveCurves({
  epoch,
  maxEpochs,
  seed,
  tool
}: {
  epoch: number;
  maxEpochs: number;
  seed: number;
  tool: "sentiment" | "complexity" | "resume";
}) {
  const width = 420;
  const height = 130;
  const left = 24;
  const right = 14;
  const top = 16;
  const bottom = 18;
  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;
  const minLoss = 0.08;
  const maxLoss = 1.55;
  const visiblePoints = Math.max(2, epoch);
  const profileIndex = seed % 4;
  const toolBias = tool === "complexity" ? 0.06 : tool === "resume" ? 0.1 : 0.02;
  const profileLabel =
    profileIndex === 0
      ? "stable-convergence"
      : profileIndex === 1
        ? "noisy-gradient"
        : profileIndex === 2
          ? "fast-converge"
          : "overfit-drift";

  const train: number[] = [];
  const val: number[] = [];

  for (let i = 0; i < visiblePoints; i++) {
    const x = i + 1;
    const seedWave = ((seed % 97) + 3) / 100;
    const trainNoiseBase = 0.04 + seedWave * 0.05;
    const valNoiseBase = 0.05 + seedWave * 0.06;
    const decay =
      profileIndex === 0
        ? 0.11 + toolBias
        : profileIndex === 1
          ? 0.095 + toolBias
          : profileIndex === 2
            ? 0.145 + toolBias
            : 0.105 + toolBias;
    const trainNoise =
      trainNoiseBase * Math.sin((x + seed) * (profileIndex === 1 ? 1.35 : 0.72));
    const valNoise =
      valNoiseBase * Math.cos((x + seed) * (profileIndex === 1 ? 1.12 : 0.61));

    let trainLoss = 1.18 * Math.exp(-decay * x) + 0.09 + toolBias + trainNoise;
    let valLoss = trainLoss + 0.09 + valNoise;

    if (profileIndex === 2) {
      trainLoss = 1.28 * Math.exp(-0.16 * x) + 0.08 + trainNoise * 0.65;
      valLoss = 1.16 * Math.exp(-0.12 * x) + 0.13 + valNoise * 0.8;
    }

    if (profileIndex === 3 && x > maxEpochs * 0.62) {
      valLoss += 0.11 + ((x - maxEpochs * 0.62) / maxEpochs) * 0.25;
    }

    if (profileIndex === 1 && x % 6 === 0) {
      valLoss += 0.08;
      trainLoss += 0.03;
    }

    trainLoss = Math.max(minLoss, trainLoss);
    valLoss = Math.max(minLoss, valLoss);
    train.push(trainLoss);
    val.push(valLoss);
  }

  const toPath = (series: number[]) =>
    series
      .map((loss, i) => {
        const x = left + (usableWidth * i) / (maxEpochs - 1);
        const normalized = (loss - minLoss) / (maxLoss - minLoss);
        const y = top + usableHeight * Math.min(1, Math.max(0, normalized));
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  return {
    trainPath: toPath(train),
    valPath: toPath(val),
    trainCurrent: train[train.length - 1] ?? 0,
    valCurrent: val[val.length - 1] ?? 0,
    profileLabel
  };
}
