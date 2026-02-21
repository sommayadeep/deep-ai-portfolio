export function detectSentiment(text: string): "Motivated" | "Curious" | "Neutral" | "Stressed" {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return "Neutral";

  const cleaned = normalized.replace(/[^a-z0-9\s]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  const motivatedTerms = [
    "build", "win", "excited", "love", "ship", "ready", "great", "awesome", "confident", "progress",
    "improve", "improving", "success", "successful", "motivated"
  ];
  const stressedTerms = [
    "stuck", "tired", "overwhelmed", "anxious", "frustrated", "worried", "stress", "stressed", "bad",
    "worst", "terrible", "awful", "hate", "failing", "failure", "hopeless", "angry", "upset"
  ];
  const curiousTerms = ["how", "why", "learn", "explore", "wonder", "what", "curious", "discover"];

  const strongNegativePhrase = /\b(this is|it is|i am|im)\s+(the\s+)?(worst|terrible|awful|hopeless)\b/.test(normalized);
  if (strongNegativePhrase) return "Stressed";

  const scoreTerms = (terms: string[]) =>
    terms.reduce((score, term) => {
      const hasExact = normalized.includes(term);
      const hasToken = tokens.some((token) => token === term || token.startsWith(term));
      return score + (hasExact || hasToken ? 1 : 0);
    }, 0);

  const stressedScore = scoreTerms(stressedTerms);
  const motivatedScore = scoreTerms(motivatedTerms);
  const curiousScore = scoreTerms(curiousTerms);

  if (stressedScore >= Math.max(motivatedScore, curiousScore) && stressedScore > 0) return "Stressed";
  if (motivatedScore >= Math.max(stressedScore, curiousScore) && motivatedScore > 0) return "Motivated";
  if (curiousScore > 0) return "Curious";

  return "Neutral";
}

export function estimateComplexity(code: string): string {
  const analysis = explainComplexity(code);
  return `${analysis.timeComplexity} likely (${analysis.reasoning[0] || "pattern detected"})`;
}

export function explainComplexity(code: string) {
  const clean = code.replace(/\s+/g, " ").toLowerCase();
  const forMatches = [...clean.matchAll(/for\s*\(([^;]*);([^;]*);([^)]+)\)/g)];
  const whileMatches = [...clean.matchAll(/while\s*\(([^)]+)\)/g)];
  const forLoops = forMatches.length;
  const whileLoops = whileMatches.length;
  const totalLoops = forLoops + whileLoops;
  const maxLoopDepth = detectMaxLoopDepth(clean);
  const loopProfile = profileLoopGrowth(clean, forMatches, whileMatches);
  const structural = inferStructuralComplexity(clean);
  const hasSort = /\.sort\(|quicksort|mergesort|heapsort/.test(clean);
  const recursion = analyzeRecursion(clean);
  const hasRecursion = recursion.hasRecursion;

  let timeComplexity = "O(1) to O(log n)";
  if (loopProfile.nonTerminatingRisk) timeComplexity = "Potentially non-terminating loop";
  else if (recursion.timeComplexity) timeComplexity = recursion.timeComplexity;
  else if (structural) timeComplexity = formatComplexity(structural.nExp, structural.logExp);
  else if (loopProfile.linearLoops > 0 && loopProfile.logLoops > 0) {
    const linearPart = loopProfile.linearLoops === 1 ? "n" : `n^${loopProfile.linearLoops}`;
    const logPart = loopProfile.logLoops === 1 ? "log n" : `(log n)^${loopProfile.logLoops}`;
    timeComplexity = `O(${linearPart} * ${logPart})`;
  } else if (loopProfile.linearLoops > 0) {
    timeComplexity = loopProfile.linearLoops === 1 ? "O(n)" : `O(n^${loopProfile.linearLoops})`;
  } else if (loopProfile.logLoops > 0) {
    timeComplexity = loopProfile.logLoops === 1 ? "O(log n)" : `O((log n)^${loopProfile.logLoops})`;
  } else if (maxLoopDepth >= 3) timeComplexity = `O(n^${maxLoopDepth})`;
  else if (maxLoopDepth === 2) timeComplexity = "O(n^2)";
  else if (hasSort && maxLoopDepth >= 1) timeComplexity = "O(n log n) to O(n^2 log n)";
  else if (hasSort) timeComplexity = "O(n log n)";
  else if (hasRecursion) timeComplexity = "O(n) to O(2^n)";
  else if (maxLoopDepth === 1) timeComplexity = "O(n)";

  const spaceComplexity = recursion.spaceComplexity ?? (hasRecursion ? "O(n) stack depth likely" : "O(1) auxiliary space likely");

  const reasoning: string[] = [];
  reasoning.push(`${totalLoops} loop structure(s) detected`);
  reasoning.push(`Max loop nesting depth: ${maxLoopDepth}`);
  reasoning.push(`Loop growth profile: ${loopProfile.linearLoops} linear, ${loopProfile.logLoops} logarithmic`);
  if (structural) {
    reasoning.push(`Dependent-bound analysis: n^${structural.nExp}, (log n)^${structural.logExp}`);
    if (structural.flags.length > 0) reasoning.push(...structural.flags);
  }
  reasoning.push(maxLoopDepth >= 2 ? "Nested iteration present" : "No nested iteration found");
  if (loopProfile.nonTerminatingRisk) reasoning.push(loopProfile.nonTerminatingRisk);
  if (recursion.reason) reasoning.push(recursion.reason);
  reasoning.push(hasRecursion ? "Recursion detected" : "No recursion pattern detected");
  reasoning.push(hasSort ? "Sort operation detected" : "No sort primitive detected");
  const derivation = buildComplexityDerivation({
    loopProfile,
    maxLoopDepth,
    hasSort,
    hasRecursion,
    timeComplexity,
    recursion
  });

  return {
    timeComplexity,
    spaceComplexity,
    reasoning,
    derivation,
    confidence: Math.max(
      45,
      Math.min(98, 65 + (totalLoops > 0 ? 12 : 0) + (hasSort ? 10 : 0) + (hasRecursion ? 8 : 0) - loopProfile.unknownLoops * 8)
    )
  };
}

function detectMaxLoopDepth(cleanCode: string) {
  const tokens = cleanCode.match(/for\s*\(|while\s*\(|\{|\}/g) ?? [];
  const blockStack: boolean[] = [];
  let pendingLoopBlocks = 0;
  let currentLoopDepth = 0;
  let maxLoopDepth = 0;

  for (const token of tokens) {
    if (token.startsWith("for") || token.startsWith("while")) {
      pendingLoopBlocks += 1;
      continue;
    }

    if (token === "{") {
      if (pendingLoopBlocks > 0) {
        pendingLoopBlocks -= 1;
        currentLoopDepth += 1;
        blockStack.push(true);
        if (currentLoopDepth > maxLoopDepth) maxLoopDepth = currentLoopDepth;
      } else {
        blockStack.push(false);
      }
      continue;
    }

    if (token === "}") {
      const isLoopBlock = blockStack.pop();
      if (isLoopBlock) currentLoopDepth = Math.max(0, currentLoopDepth - 1);
    }
  }

  // Handle loops missing braces by falling back to total loop count signal.
  if (maxLoopDepth === 0 && pendingLoopBlocks > 0) {
    return pendingLoopBlocks;
  }

  return maxLoopDepth;
}

function profileLoopGrowth(
  cleanCode: string,
  forMatches: RegExpMatchArray[],
  whileMatches: RegExpMatchArray[]
) {
  let linearLoops = 0;
  let logLoops = 0;
  let unknownLoops = 0;
  let nonTerminatingRisk: string | null = null;

  for (const match of forMatches) {
    const init = match[1] ?? "";
    const update = match[3] ?? "";
    if (/\+\+|--|\+=|-=/.test(update)) {
      linearLoops += 1;
    } else if (/\*=|\/=/.test(update)) {
      logLoops += 1;
    } else {
      unknownLoops += 1;
    }

    const iterator = (init.match(/\b([a-z_]\w*)\s*=/) ?? [])[1];
    if (iterator && /\b1\b/.test(init) && /\+\+/.test(update)) {
      const riskyDivision = new RegExp(`\\b[a-z_]\\w*\\s*=\\s*[a-z_]\\w*\\s*\\/\\s*${iterator}\\b`);
      if (riskyDivision.test(cleanCode)) {
        nonTerminatingRisk = `${iterator} starts at 1 and is used as a divisor inside a while loop; termination may fail.`;
      }
    }
  }

  for (const match of whileMatches) {
    const condition = match[1] ?? "";
    const variable = (condition.match(/\b([a-z_]\w*)\s*(?:[<>]=?|!=|==)/) ?? [])[1];
    if (!variable) {
      unknownLoops += 1;
      continue;
    }

    const updateMatch = cleanCode.match(new RegExp(`\\b${variable}\\s*=\\s*${variable}\\s*([+\\-*/])\\s*([a-z_]\\w*|\\d+)`));
    if (!updateMatch) {
      unknownLoops += 1;
      continue;
    }

    const operator = updateMatch[1];
    const rhs = updateMatch[2];
    if (operator === "+" || operator === "-") {
      linearLoops += 1;
    } else if (operator === "*" || operator === "/") {
      logLoops += 1;
      if (operator === "/" && rhs === "1") {
        nonTerminatingRisk = `${variable} is divided by 1 in while-loop update; loop may never terminate.`;
      }
    } else {
      unknownLoops += 1;
    }
  }

  return { linearLoops, logLoops, unknownLoops, nonTerminatingRisk };
}

type StructuralComplexity = {
  nExp: number;
  logExp: number;
  flags: string[];
};

type ForNode = {
  id: number;
  iterator: string | null;
  condition: string;
  update: string;
  kind: "linear" | "log" | "unknown";
  bound: string | null;
  start: number;
  end: number;
  parentId: number | null;
};

function inferStructuralComplexity(cleanCode: string): StructuralComplexity | null {
  const nodes = buildForNodes(cleanCode);
  if (nodes.length === 0) return null;

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const children = new Map<number, ForNode[]>();
  const roots: ForNode[] = [];

  for (const node of nodes) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }
    const list = children.get(node.parentId) ?? [];
    list.push(node);
    children.set(node.parentId, list);
  }

  type State = { nExp: number; logExp: number; flags: string[] };
  const results: State[] = [];

  const walk = (node: ForNode, state: State) => {
    const next = applyLoopRule(node, state, node.parentId !== null ? byId.get(node.parentId) ?? null : null);
    const directChildren = children.get(node.id) ?? [];
    if (directChildren.length === 0) {
      results.push(next);
      return;
    }
    for (const child of directChildren) walk(child, next);
  };

  for (const root of roots) {
    walk(root, { nExp: 0, logExp: 0, flags: [] });
  }

  if (results.length === 0) return null;
  results.sort((a, b) => {
    if (b.nExp !== a.nExp) return b.nExp - a.nExp;
    return b.logExp - a.logExp;
  });
  const best = results[0];
  return {
    nExp: Math.max(0, best.nExp),
    logExp: Math.max(0, best.logExp),
    flags: best.flags
  };
}

function buildForNodes(cleanCode: string): ForNode[] {
  const regex = /for\s*\(([^;]*);([^;]*);([^)]+)\)/g;
  const raw: ForNode[] = [];
  let id = 0;
  let match = regex.exec(cleanCode);
  while (match) {
    const start = match.index;
    const headerEnd = start + match[0].length;
    const end = findLoopBodyEnd(cleanCode, headerEnd);
    const init = match[1] ?? "";
    const condition = (match[2] ?? "").trim();
    const update = (match[3] ?? "").trim();
    const iterator = extractIterator(init);
    raw.push({
      id,
      iterator,
      condition,
      update,
      kind: classifyLoopKind(update),
      bound: extractBoundToken(condition, iterator),
      start,
      end,
      parentId: null
    });
    id += 1;
    match = regex.exec(cleanCode);
  }

  for (const node of raw) {
    let parent: ForNode | null = null;
    for (const candidate of raw) {
      if (candidate.id === node.id) continue;
      if (candidate.start < node.start && candidate.end > node.end) {
        if (!parent || candidate.end < parent.end) parent = candidate;
      }
    }
    node.parentId = parent ? parent.id : null;
  }

  return raw;
}

function findLoopBodyEnd(cleanCode: string, headerEnd: number) {
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

function extractIterator(init: string) {
  return (init.match(/\b([a-z_]\w*)\s*=/) ?? [])[1] ?? null;
}

function classifyLoopKind(update: string): "linear" | "log" | "unknown" {
  if (/\+\+|--|\+=|-=/.test(update)) return "linear";
  if (/\*=|\/=/.test(update)) return "log";
  return "unknown";
}

function extractBoundToken(condition: string, iterator: string | null) {
  if (!iterator) return null;
  const lhs = new RegExp(`\\b${iterator}\\b\\s*(?:<|<=|>|>=)\\s*([a-z_]\\w*|\\d+)`);
  const rhs = new RegExp(`([a-z_]\\w*|\\d+)\\s*(?:<|<=|>|>=)\\s*\\b${iterator}\\b`);
  const fromLhs = condition.match(lhs)?.[1];
  const fromRhs = condition.match(rhs)?.[1];
  return fromLhs ?? fromRhs ?? null;
}

function applyLoopRule(node: ForNode, state: { nExp: number; logExp: number; flags: string[] }, parent: ForNode | null) {
  let nExp = state.nExp;
  let logExp = state.logExp;
  const flags = [...state.flags];
  const bound = node.bound;
  const parentIterator = parent?.iterator ?? null;
  const isBoundN = bound === "n";
  const isBoundConstant = Boolean(bound && /^\d+$/.test(bound));
  const dependsOnParent = Boolean(bound && parentIterator && bound === parentIterator);

  if (node.kind === "linear") {
    if (isBoundConstant) {
      // O(1)
    } else if (isBoundN) {
      nExp += 1;
    } else if (dependsOnParent && parent?.kind === "log") {
      // Geometric summation: sum_{i=1,2,4...n} i = O(n), replacing one log factor.
      logExp = Math.max(0, logExp - 1);
      nExp += 1;
      flags.push("Geometric summation detected for dependent linear bound.");
    } else if (dependsOnParent) {
      nExp += 1;
      flags.push("Dependent linear bound detected (triangular-style growth).");
    } else {
      nExp += 1;
    }
  } else if (node.kind === "log") {
    if (isBoundConstant) {
      // O(1)
    } else if (isBoundN || dependsOnParent) {
      logExp += 1;
      if (dependsOnParent) flags.push("Dependent logarithmic bound detected.");
    } else {
      logExp += 1;
    }
  } else {
    nExp += 1;
  }

  return { nExp, logExp, flags };
}

function formatComplexity(nExp: number, logExp: number) {
  const nPart = nExp <= 0 ? "" : nExp === 1 ? "n" : `n^${nExp}`;
  const logPart = logExp <= 0 ? "" : logExp === 1 ? "log n" : `(log n)^${logExp}`;
  if (!nPart && !logPart) return "O(1)";
  if (nPart && logPart) return `O(${nPart} * ${logPart})`;
  return `O(${nPart || logPart})`;
}

function buildComplexityDerivation({
  loopProfile,
  maxLoopDepth,
  hasSort,
  hasRecursion,
  timeComplexity,
  recursion
}: {
  loopProfile: { linearLoops: number; logLoops: number; unknownLoops: number; nonTerminatingRisk: string | null };
  maxLoopDepth: number;
  hasSort: boolean;
  hasRecursion: boolean;
  timeComplexity: string;
  recursion: { hasRecursion: boolean; reason: string | null; timeComplexity: string | null; spaceComplexity: string | null };
}) {
  const steps: string[] = [];

  if (loopProfile.nonTerminatingRisk) {
    steps.push(`Termination check: ${loopProfile.nonTerminatingRisk}`);
    steps.push("Asymptotic class is undefined unless loop progress is guaranteed.");
    return steps;
  }

  if (recursion.hasRecursion && recursion.reason) {
    steps.push(`Recurrence model: ${recursion.reason}`);
    if (recursion.timeComplexity) steps.push(`Recurrence estimate: ${recursion.timeComplexity}.`);
    if (recursion.spaceComplexity) steps.push(`Stack estimate: ${recursion.spaceComplexity}.`);
  }

  steps.push(
    `Loop decomposition: ${loopProfile.linearLoops} linear term(s), ${loopProfile.logLoops} logarithmic term(s), depth ${maxLoopDepth}.`
  );

  if (loopProfile.linearLoops > 0 && loopProfile.logLoops > 0) {
    const linearPart = loopProfile.linearLoops === 1 ? "n" : `n^${loopProfile.linearLoops}`;
    const logPart = loopProfile.logLoops === 1 ? "log n" : `(log n)^${loopProfile.logLoops}`;
    steps.push(`Product model: T(n) ~= ${linearPart} * ${logPart}.`);
  } else if (loopProfile.linearLoops > 0) {
    const linearPart = loopProfile.linearLoops === 1 ? "n" : `n^${loopProfile.linearLoops}`;
    steps.push(`Linear nesting model: T(n) ~= ${linearPart}.`);
  } else if (loopProfile.logLoops > 0) {
    const logPart = loopProfile.logLoops === 1 ? "log n" : `(log n)^${loopProfile.logLoops}`;
    steps.push(`Logarithmic nesting model: T(n) ~= ${logPart}.`);
  } else if (maxLoopDepth > 1) {
    steps.push(`Fallback depth model: T(n) ~= n^${maxLoopDepth}.`);
  } else {
    steps.push("No dominant iterative growth found.");
  }

  if (hasSort) steps.push("Sorting primitive contributes an n log n factor where applicable.");
  if (hasRecursion) steps.push("Recursion can change complexity depending on branching and overlap.");
  if (loopProfile.unknownLoops > 0) {
    steps.push(`Uncertain loop(s): ${loopProfile.unknownLoops}. Estimate confidence is reduced.`);
  }

  steps.push(`Final estimate: ${timeComplexity}.`);
  return steps;
}

function analyzeRecursion(cleanCode: string) {
  const functionNames = new Set<string>();

  for (const match of cleanCode.matchAll(/function\s+([a-z_]\w*)\s*\(/g)) {
    functionNames.add(match[1]);
  }
  for (const match of cleanCode.matchAll(/\b(?:int|long|float|double|char|bool|void|string|auto)\s+([a-z_]\w*)\s*\([^)]*\)\s*\{/g)) {
    functionNames.add(match[1]);
  }

  let best: { calls: number; name: string; argPattern: string[] } | null = null;

  for (const name of functionNames) {
    const allCalls = [...cleanCode.matchAll(new RegExp(`\\b${name}\\s*\\(([^)]*)\\)`, "g"))];
    const decl = cleanCode.match(new RegExp(`\\b(?:function\\s+)?${name}\\s*\\([^)]*\\)\\s*\\{`));
    const calls = Math.max(0, allCalls.length - (decl ? 1 : 0));
    if (calls <= 0) continue;

    const argPattern = allCalls
      .map((m) => (m[1] ?? "").replace(/\s+/g, ""))
      .filter(Boolean);
    if (!best || calls > best.calls) {
      best = { calls, name, argPattern };
    }
  }

  if (!best) {
    return {
      hasRecursion: false,
      reason: null,
      timeComplexity: null,
      spaceComplexity: null
    };
  }

  const divideByConst = best.argPattern.some((arg) => /\/\d+/.test(arg));
  const decrements = best.argPattern.some((arg) => /-\d+/.test(arg));

  if (best.calls >= 2 && divideByConst) {
    const bRaw = best.argPattern.find((arg) => /\/\d+/.test(arg))?.match(/\/(\d+)/)?.[1];
    const b = bRaw ? Number(bRaw) : 2;
    const a = best.calls;
    const exponent = Math.log(a) / Math.log(Math.max(2, b));
    const rounded = Math.abs(exponent - Math.round(exponent)) < 0.05 ? String(Math.round(exponent)) : exponent.toFixed(2);
    const nTerm = rounded === "1" ? "n" : `n^${rounded}`;
    return {
      hasRecursion: true,
      reason: `T(n) = ${a}T(n/${b}) + O(1)`,
      timeComplexity: `O(${nTerm})`,
      spaceComplexity: "O(log n) stack depth likely"
    };
  }

  if (best.calls === 1 && divideByConst) {
    return {
      hasRecursion: true,
      reason: "Single recursive branch with divisive shrink",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(log n) stack depth likely"
    };
  }

  if (best.calls >= 2 && decrements) {
    return {
      hasRecursion: true,
      reason: `Branching recursion with decremental shrink (${best.calls} branches)`,
      timeComplexity: "O(2^n) to O(k^n) depending on branch factor",
      spaceComplexity: "O(n) stack depth likely"
    };
  }

  if (best.calls === 1 && decrements) {
    return {
      hasRecursion: true,
      reason: "Single recursive branch with decremental shrink",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n) stack depth likely"
    };
  }

  return {
    hasRecursion: true,
    reason: `Recursive calls detected for function ${best.name}`,
    timeComplexity: "O(n) to O(2^n) depending on branching and shrink rate",
    spaceComplexity: "O(n) stack depth likely"
  };
}

export function scoreResume(text: string) {
  const scoreBase = 55;
  let score = scoreBase;
  const normalized = text.toLowerCase();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const projectVerbRegex =
    /\b(built|developed|implemented|designed|created|deployed|engineered|optimized|trained)\b/;
  const projectEvidenceLines = lines.filter(
    (line) =>
      (line.startsWith("-") || line.startsWith("\u2022") || line.includes("project")) &&
      projectVerbRegex.test(line)
  );
  const hasProjects = projectEvidenceLines.length >= 2;
  const hasMetrics = /%|improved|reduced|increased|accuracy|latency|throughput|f1|precision|recall/.test(normalized);
  const hasAIKeywords = /machine learning|artificial intelligence|\bai\b|tensorflow|pytorch|nlp|llm|scikit-learn/.test(normalized);

  if (hasProjects) score += 15;
  if (hasMetrics) score += 15;
  if (hasAIKeywords) score += 15;

  return {
    score,
    feedback: [
      hasProjects
        ? "Strong project orientation detected."
        : "Add 2-3 project bullets with action verbs (built/developed/deployed) and outcomes.",
      hasMetrics ? "Good use of measurable outcomes." : "Include measurable metrics (latency, accuracy, growth).",
      hasAIKeywords ? "AI/ML identity is clearly visible." : "Add AI-specific technical terms aligned to target roles."
    ]
  };
}
