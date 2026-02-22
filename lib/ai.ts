export type SentimentLabel = "Motivated" | "Curious" | "Neutral" | "Stressed";

export type SentimentAnalysis = {
  label: SentimentLabel;
  confidence: number;
  score: number;
  review: string;
  signals: string[];
  toneType: "Declarative / Informational" | "Declarative / Achievement-Oriented" | "Exploratory" | "Pressure / Strain" | "Strategic / Planning";
  emotionalIntensity: "Low" | "Moderate" | "High";
  professionalAssertiveness: number;
};

const NEGATIONS = new Set(["not", "never", "no", "dont", "don't", "cant", "can't", "won't"]);
const INTENSIFIERS = new Set(["very", "really", "extremely", "super", "so", "deeply", "highly", "totally"]);
const SOFTENERS = new Set(["slightly", "somewhat", "kindof", "kinda", "maybe", "perhaps"]);

const MOTIVATED_WEIGHTS: Record<string, number> = {
  excited: 2.2,
  confident: 2,
  proud: 1.8,
  love: 1.6,
  loved: 1.8,
  enjoy: 1.6,
  enjoyed: 1.7,
  great: 1.4,
  awesome: 1.8,
  ready: 1.3,
  progress: 1.5,
  growth: 1.6,
  improving: 1.7,
  improve: 1.5,
  developed: 1.3,
  success: 1.9,
  successful: 1.9,
  motivated: 2.2,
  shipped: 1.7,
  ship: 1.4,
  solved: 1.4,
  build: 1.1
};

const STRESSED_WEIGHTS: Record<string, number> = {
  stuck: 2.4,
  overwhelmed: 2.5,
  anxious: 2.3,
  worried: 2.1,
  frustrated: 2.4,
  stressed: 2.4,
  stress: 1.8,
  exhausted: 2.2,
  tired: 1.5,
  failing: 2,
  failure: 2,
  hopeless: 2.8,
  awful: 2.2,
  terrible: 2.4,
  worst: 2.3,
  upset: 1.7,
  angry: 2
};

const CURIOUS_WEIGHTS: Record<string, number> = {
  how: 1.6,
  why: 1.6,
  what: 1.1,
  learn: 1.9,
  exploring: 1.8,
  explore: 1.8,
  curious: 2.2,
  discover: 1.8,
  understand: 1.6,
  question: 1.6
};

const ACHIEVEMENT_VERBS = new Set([
  "built",
  "complete",
  "completed",
  "done",
  "developed",
  "engineered",
  "designed",
  "implemented",
  "deployed",
  "optimized",
  "launched",
  "delivered",
  "shipped",
  "improved",
  "led",
  "created",
  "train",
  "trained",
  "win",
  "won",
  "winner",
  "winners",
  "crack",
  "cracked",
  "cracker"
]);

const STRATEGIC_TERMS = new Set([
  "strategy",
  "strategic",
  "plan",
  "roadmap",
  "prioritize",
  "priority",
  "tradeoff",
  "impact",
  "objective",
  "milestone",
  "execution"
]);

const UNCERTAINTY_TERMS = new Set([
  "maybe",
  "perhaps",
  "might",
  "unsure",
  "uncertain",
  "guess",
  "probably",
  "possibly"
]);

const TECH_IDENTITY_TERMS = new Set([
  "ai",
  "ml",
  "machine",
  "learning",
  "blockchain",
  "tensorflow",
  "pytorch",
  "llm",
  "nlp",
  "model",
  "models",
  "fullstack",
  "full",
  "stack"
]);

export function analyzeSentiment(text: string): SentimentAnalysis {
  const normalized = text.toLowerCase().trim();
  if (!normalized) {
    return {
      label: "Neutral",
      confidence: 0,
      score: 0,
      review: "No sentiment signal yet. Add a sentence and I will assess tone.",
      signals: [],
      toneType: "Declarative / Informational",
      emotionalIntensity: "Low",
      professionalAssertiveness: 0
    };
  }

  const normalizedSpaced = normalized.replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2");
  const cleaned = normalizedSpaced.replace(/[^a-z0-9?!\s']/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const toBase = (token: string) => {
    if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3);
    if (token.endsWith("ed") && token.length > 4) return token.slice(0, -2);
    if (token.endsWith("s") && token.length > 4) return token.slice(0, -1);
    return token;
  };

  let motivated = 0;
  let stressed = 0;
  let curious = 0;
  let achievementScore = 0;
  let strategicScore = 0;
  let uncertaintyScore = 0;
  let technicalIdentityScore = 0;
  let emotionHits = 0;
  let intentHits = 0;
  const signals: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const baseToken = toBase(token);
    const prev = tokens[i - 1] ?? "";
    const prev2 = tokens[i - 2] ?? "";
    const negated = NEGATIONS.has(prev) || NEGATIONS.has(prev2);
    const intensified = INTENSIFIERS.has(prev) || INTENSIFIERS.has(prev2);
    const softened = SOFTENERS.has(prev) || SOFTENERS.has(prev2);
    const multiplier = (intensified ? 1.35 : 1) * (softened ? 0.75 : 1);

    const motivatedWeight = MOTIVATED_WEIGHTS[token] ?? MOTIVATED_WEIGHTS[baseToken];
    if (motivatedWeight) {
      const weighted = motivatedWeight * multiplier;
      if (negated) stressed += weighted * 0.7;
      else motivated += weighted;
      emotionHits += 1;
      signals.push(`${negated ? "negated+" : "+"}${token}`);
    }

    const stressedWeight = STRESSED_WEIGHTS[token] ?? STRESSED_WEIGHTS[baseToken];
    if (stressedWeight) {
      const weighted = stressedWeight * multiplier;
      if (negated) motivated += weighted * 0.5;
      else stressed += weighted;
      emotionHits += 1;
      signals.push(`${negated ? "negated-" : "-"}${token}`);
    }

    const curiousWeight = CURIOUS_WEIGHTS[token] ?? CURIOUS_WEIGHTS[baseToken];
    if (curiousWeight) {
      const weighted = curiousWeight * multiplier;
      curious += weighted;
      emotionHits += 1;
      signals.push(`?${token}`);
    }

    if (ACHIEVEMENT_VERBS.has(token) || ACHIEVEMENT_VERBS.has(baseToken)) {
      achievementScore += 1 * multiplier;
      intentHits += 1;
      motivated += 0.2 * multiplier;
      signals.push(`achv:${token}`);
      if (token === "completed" || token === "complete") motivated += 0.6;
    }
    if (STRATEGIC_TERMS.has(token)) {
      strategicScore += 1;
      intentHits += 1;
      signals.push(`strat:${token}`);
    }
    if (UNCERTAINTY_TERMS.has(token)) {
      uncertaintyScore += 1;
      signals.push(`uncertain:${token}`);
    }
    if (TECH_IDENTITY_TERMS.has(token)) {
      technicalIdentityScore += 1;
      intentHits += 1;
      if (technicalIdentityScore <= 3) signals.push(`tech:${token}`);
    }
  }

  const quantifiedAchievement =
    /\b\d+\+?\s*(projects?|models?|apps?|systems?|products?|hackathons?)\b/.test(normalizedSpaced) ||
    /\b(completed|built|developed|delivered|done)\s+\d+\b/.test(normalizedSpaced);
  const accoladeSignal =
    /\b(hackathon|winner|winners|award|awards|google job|job crack|job cracked|job cracker)\b/.test(normalized);
  if (quantifiedAchievement) {
    achievementScore += 1.4;
    motivated += 0.7;
    intentHits += 1;
    signals.push("achv:quantified");
  }
  if (accoladeSignal) {
    achievementScore += 1.2;
    motivated += 0.5;
    intentHits += 1;
    signals.push("achv:accolade");
  }
  const selfDiminishSignal = /\b(nothing special|just only)\b/.test(normalized);
  if (selfDiminishSignal) {
    uncertaintyScore += 0.7;
    signals.push("frame:self-minimizing");
  }

  const questionMarks = (normalized.match(/\?/g) ?? []).length;
  if (questionMarks > 0) curious += Math.min(2.2, questionMarks * 0.9);

  const exclamations = (normalized.match(/!/g) ?? []).length;
  if (exclamations > 0 && motivated > 0) motivated += Math.min(1.8, exclamations * 0.6);
  if (exclamations > 0 && stressed > 0) stressed += Math.min(1.6, exclamations * 0.5);

  if (/\b(i am|im|it is|this is)\s+(the\s+)?(worst|terrible|awful|hopeless)\b/.test(normalized)) {
    stressed += 2.8;
    signals.push("-strong-negative-phrase");
  }

  const total = motivated + stressed + curious;
  const dominant = Math.max(motivated, stressed, curious);
  const second = [motivated, stressed, curious].sort((a, b) => b - a)[1] ?? 0;
  const margin = Math.max(0, dominant - second);
  const declarativeSignal = /[.]$/.test(normalized) ? 1 : 0;
  const tokenCount = Math.max(1, tokens.length);

  let label: SentimentLabel = "Neutral";
  if (total < 1.6) label = "Neutral";
  else if (stressed >= motivated * 1.15 && stressed >= curious * 1.1 && stressed >= 1.8) label = "Stressed";
  else if (motivated >= stressed * 1.05 && motivated >= curious && motivated >= 1.7) label = "Motivated";
  else if (curious >= Math.max(motivated, stressed) && curious >= 1.5) label = "Curious";
  else if (margin < 0.7) label = "Neutral";
  else label = dominant === stressed ? "Stressed" : dominant === motivated ? "Motivated" : "Curious";

  const emotionalClarity = total === 0 ? 0 : (margin / (total + 1.8)) * 34 + Math.min(22, total * 6);
  const intentPower = Math.min(4, achievementScore * 0.9 + strategicScore * 0.8 + technicalIdentityScore * 0.45);
  const intentClarity = intentPower * 6 - Math.min(16, uncertaintyScore * 6.5);
  const structureClarity = Math.min(10, declarativeSignal * 4 + Math.min(3, questionMarks) * 2 + Math.min(3, exclamations) * 2);
  const evidenceCount = emotionHits + intentHits + questionMarks + exclamations;
  const evidenceDensity = evidenceCount / Math.max(4, tokenCount);
  const neutralIntentBoost = total < 1.6 && intentPower >= 1 ? 8 : 0;
  let confidence = Math.round(Math.max(30, Math.min(94, 32 + emotionalClarity + intentClarity + structureClarity + neutralIntentBoost)));
  if (evidenceCount <= 1) confidence = Math.min(confidence, 58);
  if (evidenceDensity < 0.12 && total < 2) confidence = Math.max(30, confidence - 8);
  if (evidenceDensity > 0.3 && tokenCount >= 5) confidence = Math.min(94, confidence + 4);
  const rawScore =
    (motivated - stressed) * 20 +
    achievementScore * 1.4 +
    strategicScore * 1.2 +
    (quantifiedAchievement ? 4 : 0) +
    (accoladeSignal ? 3 : 0) -
    uncertaintyScore * 5;
  const score = Math.round((rawScore * 90) / (Math.abs(rawScore) + 90));

  let toneType: SentimentAnalysis["toneType"] = "Declarative / Informational";
  if (label === "Stressed") toneType = "Pressure / Strain";
  else if (questionMarks > 0 || label === "Curious") toneType = "Exploratory";
  else if (achievementScore >= 1) toneType = "Declarative / Achievement-Oriented";
  else if (strategicScore >= 1) toneType = "Strategic / Planning";

  let emotionalIntensity: SentimentAnalysis["emotionalIntensity"] = "Low";
  if (total >= 5.4) emotionalIntensity = "High";
  else if (total >= 2.2) emotionalIntensity = "Moderate";

  if (label === "Neutral" && toneType === "Declarative / Achievement-Oriented" && uncertaintyScore === 0) {
    confidence = Math.max(confidence, 56);
  }

  if (label === "Neutral" && emotionalIntensity === "Low") {
    confidence = Math.min(confidence, 84);
  }

  const rawAssertiveness =
    30 +
    achievementScore * 14 +
    strategicScore * 9 +
    technicalIdentityScore * 2 +
    (quantifiedAchievement ? 6 : 0) -
    uncertaintyScore * 14;
  const professionalAssertiveness = Math.round((Math.max(0, rawAssertiveness) * 92) / (Math.max(0, rawAssertiveness) + 92));
  const adjustedAssertiveness =
    label === "Neutral" && toneType === "Declarative / Achievement-Oriented" && uncertaintyScore === 0
      ? Math.max(professionalAssertiveness, 52)
      : professionalAssertiveness;

  let review = "Tone is mostly informational with mixed emotional cues.";
  if (label === "Motivated") review = "You sound optimistic and execution-focused, with clear forward momentum.";
  if (label === "Motivated" && selfDiminishSignal) {
    review = "Your wording is humble, but your achievements and credentials still read as strongly motivated and capable.";
  }
  if (label === "Stressed") review = "You sound blocked or overloaded right now; the language reflects pressure and frustration.";
  if (label === "Curious") review = "You sound exploratory and learning-driven, asking investigative questions.";
  if (label === "Neutral" && toneType === "Declarative / Achievement-Oriented") {
    review = "This is factual and achievement-oriented, with implicit confidence but low emotional intensity.";
    if (selfDiminishSignal) {
      review = "You use a humble frame, but the content still signals strong achievement and capability.";
    }
  } else if (label === "Neutral" && total < 1.6) {
    review = "This reads mostly factual; there are not enough emotional signals to classify strongly.";
  }

  return {
    label,
    confidence,
    score,
    review,
    signals: signals.slice(0, 7),
    toneType,
    emotionalIntensity,
    professionalAssertiveness: adjustedAssertiveness
  };
}

export function detectSentiment(text: string): SentimentLabel {
  return analyzeSentiment(text).label;
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
  const normalized = text.toLowerCase();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const actionVerbRegex =
    /\b(built|developed|implemented|designed|created|deployed|engineered|optimized|led|improved|launched|automated)\b/;
  const metricRegex = /\b(\d+%|\d+x|\$[\d,.]+|latency|accuracy|throughput|f1|precision|recall|reduced|increased|improved)\b/;
  const aiKeywordRegex = /\b(machine learning|artificial intelligence|ai|tensorflow|pytorch|nlp|llm|scikit-learn|rag|transformer)\b/;
  const sectionRegex = /\b(summary|experience|projects|education|skills|certifications)\b/;

  const bulletLines = lines.filter((line) => line.startsWith("-") || line.startsWith("\u2022"));
  const actionLines = lines.filter((line) => actionVerbRegex.test(line));
  const metricLines = lines.filter((line) => metricRegex.test(line));
  const aiKeywordCount = (normalized.match(aiKeywordRegex) ?? []).length;
  const sectionCount = (normalized.match(sectionRegex) ?? []).length;
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let score = 20;

  const projectImpact = Math.min(24, actionLines.length * 4 + metricLines.length * 3);
  const structureQuality = Math.min(18, sectionCount * 3 + Math.min(6, bulletLines.length));
  const roleAlignment = Math.min(18, aiKeywordCount * 4);
  const contentDepth = wordCount < 80 ? 4 : wordCount < 160 ? 10 : wordCount < 420 ? 16 : 12;

  score += projectImpact + structureQuality + roleAlignment + contentDepth;

  let penalties = 0;
  if (wordCount < 70) penalties += 10;
  if (actionLines.length < 2) penalties += 8;
  if (metricLines.length === 0) penalties += 10;
  if (sectionCount < 3) penalties += 7;
  if (aiKeywordCount > 12 && metricLines.length < 2) penalties += 6;

  score = Math.max(24, Math.min(96, Math.round(score - penalties)));

  const strengths: string[] = [];
  if (actionLines.length >= 3) strengths.push("Strong action-oriented experience bullets.");
  if (metricLines.length >= 2) strengths.push("Good use of measurable business or model outcomes.");
  if (sectionCount >= 4) strengths.push("Resume structure is clear and recruiter-friendly.");
  if (aiKeywordCount >= 2) strengths.push("Technical identity for AI/ML roles is visible.");

  const improvements: string[] = [];
  if (actionLines.length < 3) improvements.push("Add more action-first bullets (Built, Led, Optimized) under projects/experience.");
  if (metricLines.length < 2) improvements.push("Quantify impact with concrete numbers (%, x, latency, accuracy, revenue).");
  if (sectionCount < 4) improvements.push("Use clearer sections: Summary, Experience, Projects, Skills, Education.");
  if (wordCount < 120) improvements.push("Add depth: include project context, stack, and outcomes in 2-3 bullets each.");
  if (aiKeywordCount === 0) improvements.push("Add role-specific AI/ML terms that match your target jobs.");

  const feedback = [...strengths.slice(0, 2), ...improvements.slice(0, 3)];
  if (feedback.length === 0) feedback.push("Resume quality is balanced; tighten wording for stronger impact.");

  return {
    score,
    feedback
  };
}
