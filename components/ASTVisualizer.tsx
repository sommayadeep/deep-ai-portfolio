"use client";

import { useEffect, useMemo, useState } from "react";

type LoopNode = {
  id: number;
  type: "for" | "while";
  header: string;
  start: number;
  end: number;
  parentId: number | null;
  depth: number;
  localGrowth?: string;
};

export default function ASTVisualizer({ code }: { code: string }) {
  const data = useMemo(() => analyzeCode(code), [code]);
  const [mode, setMode] = useState<"static" | "recurrence" | "loop">("static");
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (mode !== "recurrence" || !data.recursion.isRecursive) return;
    setLevel(0);
    const timer = setInterval(() => {
      setLevel((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 900);
    return () => clearInterval(timer);
  }, [mode, data.recursion.isRecursive]);

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-cyan-200/20 bg-[#0d1738]/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-widest text-cyan-200/75">Compiler Pass Mode</p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <button className={passClass(mode === "static")} onClick={() => setMode("static")}>Static Mode</button>
            <button className={passClass(mode === "recurrence")} onClick={() => setMode("recurrence")}>Recurrence Mode</button>
            <button className={passClass(mode === "loop")} onClick={() => setMode("loop")}>Loop Decomposition</button>
          </div>
        </div>
      </div>

      {mode === "static" ? <StaticGraph data={data} /> : null}
      {mode === "loop" ? <LoopDecompositionGraph data={data} /> : null}
      {mode === "recurrence" ? <RecurrenceGraph data={data} level={level} /> : null}
    </div>
  );
}

function passClass(active: boolean) {
  return active
    ? "rounded-full border border-cyan-200/40 bg-cyan-400/20 px-2.5 py-1 text-cyan-100"
    : "rounded-full border border-cyan-200/20 bg-[#101d45] px-2.5 py-1 text-cyan-200/80";
}

function StaticGraph({ data }: { data: ReturnType<typeof analyzeCode> }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const loopWeights = data.loops.map((loop) => growthWeight(loop.localGrowth));
  const totalLoopWeight = Math.max(0.01, loopWeights.reduce((sum, v) => sum + v, 0));

  const nodes = [
    { id: "program", x: 60, y: 30, label: "Program", kind: "program", cost: "O(1)", contribution: "orchestration", formula: "Global compilation unit", bound: "Constant node setup", contributionPct: 0 },
    { id: "func", x: 220, y: 30, label: `Function ${data.functionName}`, kind: "function", cost: "O(1)", contribution: "combine children", formula: "Aggregate child complexities", bound: "Parent node composition", contributionPct: 0 },
    ...data.loops.map((loop, index) => ({
      id: `loop-${loop.id}`,
      x: 60 + (index % 3) * 160,
      y: 100 + Math.floor(index / 3) * 90,
      label: `${loop.type.toUpperCase()}(${short(loop.header, 16)})`,
      kind: "loop",
      cost: loop.localGrowth,
      contribution: "multiplicative",
      formula: inferFormula(loop),
      bound: inferBound(loop),
      contributionPct: Math.round((growthWeight(loop.localGrowth) / totalLoopWeight) * 100)
    }))
  ];

  const edges = [{ from: "program", to: "func" }];
  for (const loop of data.loops) {
    if (loop.parentId === null) edges.push({ from: "func", to: `loop-${loop.id}` });
    else edges.push({ from: `loop-${loop.parentId}`, to: `loop-${loop.id}` });
  }

  const orderedLoopIds = [...data.loops]
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.id - b.id;
    })
    .map((loop) => `loop-${loop.id}`);

  const evaluationSteps = [
    ...orderedLoopIds.map((nodeId, idx) => {
      const node = nodes.find((n) => n.id === nodeId);
      return {
        key: `local-${nodeId}`,
        active: nodeId,
        text: `Step ${idx + 1}: Compute local growth for ${node?.label} -> ${node?.cost}.`
      };
    }),
    {
      key: "combine-function",
      active: "func",
      text: `Combine step: ${data.loops.map((l) => l.localGrowth).join(" x ")} -> ${data.combinedLoopComplexity}.`
    },
    {
      key: "final-program",
      active: "program",
      text: `Finalization: program node emits ${data.combinedLoopComplexity}.`
    }
  ];

  useEffect(() => {
    setStepIndex(0);
    if (evaluationSteps.length === 0) return;
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev >= evaluationSteps.length - 1 ? 0 : prev + 1));
    }, 920);
    return () => clearInterval(timer);
  }, [data.combinedLoopComplexity, evaluationSteps.length]);

  const activeNodeIds = new Set(
    evaluationSteps.slice(0, stepIndex + 1).map((step) => step.active)
  );
  const currentStep = evaluationSteps[stepIndex];
  const hoveredNode = nodes.find((node) => node.id === hoveredId) ?? null;
  const dominance = detectDominance([
    data.combinedLoopComplexity,
    ...data.loops.map((loop) => loop.localGrowth || "O(1)"),
    "O(1)"
  ]);

  return (
    <div className="rounded-lg border border-cyan-200/20 bg-[#0d1738]/80 p-3">
      <p className="text-[11px] uppercase tracking-widest text-cyan-200/75">Syntax Graph + Complexity Weight Overlay</p>
      <GraphSvg nodes={nodes} edges={edges} activeNodeIds={activeNodeIds} hoveredId={hoveredId} onHover={setHoveredId} />
      <p className="mt-2 text-xs text-cyan-100">
        Runtime Pass: <span className="font-semibold text-white">{currentStep?.text}</span>
      </p>
      <p className="mt-2 text-xs text-cyan-100">
        Final Combined Complexity Signal: <span className="font-semibold text-white">{data.combinedLoopComplexity}</span>
      </p>
      <p className="mt-1 text-xs text-cyan-100">
        Dominance Detector: <span className="font-semibold text-white">{dominance.simplified}</span>
      </p>
      <p className="mt-1 text-xs text-cyan-100">{dominance.explanation}</p>
      {hoveredNode ? (
        <div className="mt-3 rounded-md border border-cyan-200/20 bg-[#101b40] p-2 text-xs text-cyan-100">
          <p className="font-semibold text-white">{hoveredNode.label}</p>
          <p>Local Cost: {hoveredNode.cost}</p>
          <p>Formula: {hoveredNode.formula}</p>
          <p>Bound: {hoveredNode.bound}</p>
          <p>Contribution Weight: {hoveredNode.contributionPct}%</p>
        </div>
      ) : null}
    </div>
  );
}

function LoopDecompositionGraph({ data }: { data: ReturnType<typeof analyzeCode> }) {
  if (data.loops.length === 0) {
    return (
      <div className="rounded-lg border border-cyan-200/20 bg-[#0d1738]/80 p-3 text-xs text-cyan-200/85">
        No loop decomposition available for this snippet.
      </div>
    );
  }

  const factors = data.loops.map((loop) => loop.localGrowth);
  const expression = factors.join(" x ");
  const finalExpr = data.combinedLoopComplexity;

  return (
    <div className="rounded-lg border border-cyan-200/20 bg-[#0d1738]/80 p-3">
      <p className="text-[11px] uppercase tracking-widest text-cyan-200/75">Loop Decomposition Mode</p>
      <div className="mt-2 grid gap-2 text-xs text-blue-100">
        {data.loops.map((loop, idx) => (
          <p key={loop.id}>
            Node {idx + 1} ({loop.type}): Local Growth <span className="font-semibold text-cyan-100">{loop.localGrowth}</span>
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs text-cyan-100">
        Combined Product: <span className="font-semibold text-white">{expression}</span>
      </p>
      <p className="mt-1 text-xs text-cyan-100">
        Final Reduced Big-O: <span className="font-semibold text-white">{finalExpr}</span>
      </p>
    </div>
  );
}

function RecurrenceGraph({ data, level }: { data: ReturnType<typeof analyzeCode>; level: number }) {
  if (!data.recursion.isRecursive) {
    return (
      <div className="rounded-lg border border-cyan-200/20 bg-[#0d1738]/80 p-3 text-xs text-cyan-200/85">
        No recursion detected. Switch to Static or Loop Decomposition mode.
      </div>
    );
  }

  const branch = Math.max(2, data.recursion.branchFactor);
  const levels = Array.from({ length: level + 1 }, (_, i) => i);
  const nodesPerLevel = levels.map((d) => Math.pow(branch, d));
  const totalNodes = nodesPerLevel.reduce((sum, count) => sum + count, 0);
  const depthText = `Level 0..${level}: ${nodesPerLevel.join(" + ")} = ${totalNodes}`;

  return (
    <div className="rounded-lg border border-cyan-200/20 bg-[#0d1738]/80 p-3">
      <p className="text-[11px] uppercase tracking-widest text-cyan-200/75">Recurrence Expansion Mode</p>
      <svg viewBox="0 0 420 180" className="mt-2 h-44 w-full">
        {levels.map((d) => {
          const count = nodesPerLevel[d];
          return Array.from({ length: count }, (_, idx) => {
            const y = 24 + d * 34;
            const x = count === 1 ? 210 : 30 + (360 * idx) / Math.max(1, count - 1);
            const parentCount = d === 0 ? 1 : nodesPerLevel[d - 1];
            if (d > 0) {
              const parentIdx = Math.floor(idx / branch);
              const px = parentCount === 1 ? 210 : 30 + (360 * parentIdx) / Math.max(1, parentCount - 1);
              const py = 24 + (d - 1) * 34;
              return (
                <g key={`edge-${d}-${idx}`}>
                  <line x1={px} y1={py + 8} x2={x} y2={y - 8} stroke="#6ee7ff" strokeOpacity="0.5" strokeWidth="1.2" />
                  <circle cx={x} cy={y} r="6.5" fill="#1a2d61" stroke="#a5b4fc" strokeWidth="1.5" />
                </g>
              );
            }
            return (
              <g key={`node-${d}-${idx}`}>
                <circle cx={x} cy={y} r="7.5" fill="#143060" stroke="#59f6ff" strokeWidth="1.6" />
              </g>
            );
          });
        })}
      </svg>
      <p className="mt-2 text-xs text-cyan-100">
        Expansion depth: <span className="font-semibold text-white">{level}</span> | Branch factor:{" "}
        <span className="font-semibold text-white">{branch}</span>
      </p>
      <p className="mt-1 text-xs text-cyan-100">{depthText}</p>
      <ol className="mt-2 space-y-1 text-xs text-blue-100">
        {data.recurrenceFlow.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

function GraphSvg({
  nodes,
  edges,
  activeNodeIds,
  hoveredId,
  onHover
}: {
  nodes: Array<{ id: string; x: number; y: number; label: string; kind: string; cost: string; contribution: string; formula: string; bound: string; contributionPct: number }>;
  edges: Array<{ from: string; to: string }>;
  activeNodeIds: Set<string>;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 520 250" className="mt-2 h-52 w-full">
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        return <line key={`${edge.from}-${edge.to}`} x1={from.x + 55} y1={from.y + 18} x2={to.x + 55} y2={to.y + 4} stroke="#67e8f9" strokeOpacity="0.55" strokeWidth="1.5" />;
      })}
      {nodes.map((node) => {
        const color = node.kind === "program" ? "#59f6ff" : node.kind === "function" ? "#93c5fd" : "#a5b4fc";
        const active = activeNodeIds.has(node.id);
        const hovered = hoveredId === node.id;
        return (
          <g key={node.id} onMouseEnter={() => onHover(node.id)} onMouseLeave={() => onHover(null)}>
            <rect
              x={node.x}
              y={node.y}
              width="110"
              height="54"
              rx="10"
              fill={active ? "#1a3569" : "#11244f"}
              stroke={color}
              strokeOpacity={hovered ? "1" : active ? "0.95" : "0.7"}
              strokeWidth={hovered ? "2.4" : active ? "2" : "1.4"}
            />
            <text x={node.x + 55} y={node.y + 18} textAnchor="middle" fontSize="9" fill="#e6f4ff">
              {node.label}
            </text>
            <text x={node.x + 55} y={node.y + 33} textAnchor="middle" fontSize="8.5" fill="#9be9ff">
              Local: {node.cost}
            </text>
            <text x={node.x + 55} y={node.y + 46} textAnchor="middle" fontSize="8" fill="#c7d7ff">
              {node.contribution}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function short(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 2)}..`;
}

function factorMultiply(factors: string[]) {
  let n = 0;
  let logn = 0;
  for (const f of factors) {
    if (f === "O(n)") n += 1;
    if (f === "O(log n)") logn += 1;
    if (f === "O(n^2)") n += 2;
  }
  const nPart = n === 0 ? "" : n === 1 ? "n" : `n^${n}`;
  const lPart = logn === 0 ? "" : logn === 1 ? "log n" : `(log n)^${logn}`;
  if (!nPart && !lPart) return "O(1)";
  if (nPart && lPart) return `O(${nPart} * ${lPart})`;
  return `O(${nPart || lPart})`;
}

function inferLocalGrowth(loop: LoopNode) {
  const header = loop.header.toLowerCase();
  const parts = header.split(";");
  const update = parts[2] ?? "";
  const condition = parts[1] ?? header;
  if (/\*=|\/=/.test(update) || /\/\s*2|>>/.test(update)) return "O(log n)";
  if (/\+\+|--|\+=|-=/.test(update)) {
    if (/\b<\s*i\b|\b<\s*j\b|\b<\s*k\b/.test(condition)) return "O(n)";
    return "O(n)";
  }
  return "O(n)";
}

function inferFormula(loop: LoopNode) {
  const parts = loop.header.split(";");
  const init = parts[0]?.trim() || "init";
  const cond = parts[1]?.trim() || "condition";
  const update = parts[2]?.trim() || "update";
  return `${init}; ${cond}; ${update}`;
}

function inferBound(loop: LoopNode) {
  const cond = (loop.header.split(";")[1] || loop.header).trim();
  return `Derived from loop condition: ${short(cond, 28)}`;
}

function growthWeight(growth?: string) {
  if (!growth) return 0.2;
  if (growth.includes("n^2")) return 2;
  if (growth.includes("n")) return 1;
  if (growth.includes("log n")) return 0.6;
  return 0.3;
}

function detectDominance(rawTerms: string[]) {
  const terms = rawTerms.map(parseBigOTerm).filter((term): term is BigOTerm => term !== null);
  if (terms.length === 0) {
    return {
      simplified: "O(1)",
      explanation: "No analyzable growth terms found; defaulting to constant-time baseline."
    };
  }

  const best = terms.reduce((current, next) => (compareTerms(next, current) > 0 ? next : current));
  const simplified = formatTerm(best);

  const hasPoly = terms.some((t) => t.nExp > 0);
  const hasLog = terms.some((t) => t.logExp > 0);
  const maxPoly = Math.max(...terms.map((t) => t.nExp));
  const minPolyPositive = Math.min(...terms.filter((t) => t.nExp > 0).map((t) => t.nExp), Infinity);
  const hasNLogN = terms.some((t) => t.nExp === 1 && t.logExp >= 1);
  const hasLinear = terms.some((t) => t.nExp === 1 && t.logExp === 0);

  if (maxPoly >= 2 && minPolyPositive < maxPoly) {
    return {
      simplified,
      explanation: "Higher degree polynomial dominates lower degree polynomial terms."
    };
  }

  if (hasPoly && hasLog) {
    return {
      simplified,
      explanation: "Polynomial term dominates logarithmic terms in asymptotic growth."
    };
  }

  if (hasNLogN && hasLinear) {
    return {
      simplified,
      explanation: "Multiplicative logarithmic factor makes n log n dominate additive linear terms."
    };
  }

  if (best.nExp === 0 && best.logExp > 0) {
    return {
      simplified,
      explanation: "Logarithmic term dominates constant-time additive terms."
    };
  }

  return {
    simplified,
    explanation: "Dominant term selected by symbolic asymptotic comparator."
  };
}

type BigOTerm = {
  nExp: number;
  logExp: number;
};

function parseBigOTerm(raw: string): BigOTerm | null {
  const value = raw.toLowerCase().replace(/\s+/g, "");
  if (!value.startsWith("o(") || !value.endsWith(")")) return null;
  const inner = value.slice(2, -1);
  if (inner === "1") return { nExp: 0, logExp: 0 };

  const nPow = inner.match(/n\^(\d+)/)?.[1];
  const hasN = /\bn\b|n\*|\*n/.test(inner) || inner.startsWith("n") || inner.includes("n^");
  const nExp = nPow ? Number(nPow) : hasN ? 1 : 0;

  const logPow = inner.match(/\(logn\)\^(\d+)/)?.[1];
  const hasLog = inner.includes("logn");
  const logExp = logPow ? Number(logPow) : hasLog ? 1 : 0;

  return { nExp, logExp };
}

function compareTerms(a: BigOTerm, b: BigOTerm) {
  if (a.nExp !== b.nExp) return a.nExp - b.nExp;
  if (a.logExp !== b.logExp) return a.logExp - b.logExp;
  return 0;
}

function formatTerm(term: BigOTerm) {
  const nPart = term.nExp === 0 ? "" : term.nExp === 1 ? "n" : `n^${term.nExp}`;
  const lPart = term.logExp === 0 ? "" : term.logExp === 1 ? "log n" : `(log n)^${term.logExp}`;
  if (!nPart && !lPart) return "O(1)";
  if (nPart && lPart) return `O(${nPart} * ${lPart})`;
  return `O(${nPart || lPart})`;
}

function analyzeCode(code: string) {
  const clean = code.replace(/\s+/g, " ").trim();
  const functionName =
    clean.match(/\bfunction\s+([a-z_]\w*)\s*\(/i)?.[1] ||
    clean.match(/\b(?:int|long|float|double|char|bool|void|string|auto)\s+([a-z_]\w*)\s*\(/i)?.[1] ||
    "anonymous_fn";
  const params = clean.match(new RegExp(`${functionName}\\s*\\(([^)]*)\\)`))?.[1] ?? "";
  const loops = parseLoops(clean);
  const recursion = analyzeRecursion(clean, functionName);
  const loopsWithGrowth = loops.map((loop) => ({ ...loop, localGrowth: inferLocalGrowth(loop) }));

  const syntaxTree: Array<{ depth: number; label: string }> = [
    { depth: 0, label: "Program" },
    { depth: 1, label: `FunctionDeclaration(${functionName})` },
    { depth: 2, label: `Parameters(${params || "none"})` },
    { depth: 2, label: "Body" }
  ];

  for (const loop of loopsWithGrowth) {
    syntaxTree.push({ depth: Math.min(4, loop.depth + 3), label: `${loop.type.toUpperCase()}Loop(${loop.header})` });
  }

  if (recursion.isRecursive) {
    syntaxTree.push({ depth: 2, label: `Return -> ${recursion.branchFactor} recursive call(s)` });
  }

  const loopTree = loopsWithGrowth.map((loop) => ({
    depth: loop.depth,
    label: `${loop.type} (${loop.header}) -> ${loop.localGrowth}`
  }));

  const recurrenceFlow = buildRecurrenceFlow(recursion);
  const combinedLoopComplexity = factorMultiply(loopsWithGrowth.map((loop) => loop.localGrowth));

  return {
    functionName,
    syntaxTree,
    loopTree,
    loops: loopsWithGrowth,
    recursion,
    recurrenceFlow,
    combinedLoopComplexity
  };
}

function parseLoops(cleanCode: string): LoopNode[] {
  const loopRegex = /\b(for|while)\s*\(([^)]*)\)/g;
  const nodes: LoopNode[] = [];
  let id = 0;
  let match = loopRegex.exec(cleanCode);

  while (match) {
    const start = match.index;
    const headerEnd = start + match[0].length;
    const end = findBodyEnd(cleanCode, headerEnd);
    nodes.push({
      id,
      type: match[1] as "for" | "while",
      header: match[2].trim(),
      start,
      end,
      parentId: null,
      depth: 0
    });
    id += 1;
    match = loopRegex.exec(cleanCode);
  }

  for (const node of nodes) {
    let parent: LoopNode | null = null;
    for (const candidate of nodes) {
      if (candidate.id === node.id) continue;
      if (candidate.start < node.start && candidate.end > node.end) {
        if (!parent || candidate.end < parent.end) parent = candidate;
      }
    }
    node.parentId = parent ? parent.id : null;
    node.depth = parent ? parent.depth + 1 : 0;
  }

  return nodes;
}

function findBodyEnd(cleanCode: string, headerEnd: number) {
  let i = headerEnd;
  while (i < cleanCode.length && /\s/.test(cleanCode[i])) i += 1;
  if (cleanCode[i] !== "{") {
    const semi = cleanCode.indexOf(";", i);
    return semi === -1 ? cleanCode.length : semi;
  }

  let depth = 0;
  for (let idx = i; idx < cleanCode.length; idx += 1) {
    if (cleanCode[idx] === "{") depth += 1;
    if (cleanCode[idx] === "}") {
      depth -= 1;
      if (depth === 0) return idx;
    }
  }
  return cleanCode.length;
}

function analyzeRecursion(cleanCode: string, functionName: string) {
  const calls = [...cleanCode.matchAll(new RegExp(`\\b${functionName}\\s*\\(([^)]*)\\)`, "g"))];
  const branchFactor = Math.max(0, calls.length - 1);
  const args = calls.map((m) => (m[1] ?? "").replace(/\s+/g, "")).filter(Boolean);
  const shrink = args.some((a) => /\/\d+/.test(a))
    ? "divisive"
    : args.some((a) => /-\d+/.test(a))
      ? "decremental"
      : "unknown";

  return {
    isRecursive: branchFactor > 0,
    branchFactor,
    shrink
  };
}

function buildRecurrenceFlow(recursion: { isRecursive: boolean; branchFactor: number; shrink: string }) {
  if (!recursion.isRecursive) {
    return ["1. No recursion found in this snippet.", "2. Use loop-growth model only.", "3. Solve final Big-O from loop composition."];
  }

  if (recursion.shrink === "divisive") {
    return [
      `1. Detect recurrence form: T(n) = ${recursion.branchFactor}T(n/b) + f(n).`,
      "2. Expand tree by levels until base case n <= 1.",
      "3. Aggregate per-level work and leaf-count growth.",
      "4. Apply recurrence estimate (Master-style) for final asymptotic class."
    ];
  }

  if (recursion.shrink === "decremental") {
    return [
      `1. Detect recurrence form: T(n) = ${recursion.branchFactor}T(n-1) + f(n).`,
      "2. Expand linearly over n levels.",
      "3. Sum per-level work or branch growth.",
      "4. Derive asymptotic upper bound."
    ];
  }

  return [
    "1. Recursive self-call detected.",
    "2. Estimate branch factor and shrink behavior.",
    "3. Construct recurrence tree approximation.",
    "4. Solve for conservative asymptotic bound."
  ];
}
