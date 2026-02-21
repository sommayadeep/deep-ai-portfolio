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
  const clean = code.replace(/\s+/g, " ").toLowerCase();
  const nestedLoops = (clean.match(/for\s*\(/g)?.length ?? 0) + (clean.match(/while\s*\(/g)?.length ?? 0);
  const hasSort = /\.sort\(|quicksort|mergesort|heapsort/.test(clean);
  const hasRecursion = /function\s+\w+\([^)]*\)\s*\{[^}]*\1\(/.test(clean);

  if (nestedLoops >= 2) return "O(n^2) likely (nested iteration detected)";
  if (hasSort) return "O(n log n) likely (sorting behavior detected)";
  if (hasRecursion) return "Recursive pattern detected (depends on branching; ~O(n) to O(2^n))";
  if (nestedLoops === 1) return "O(n) likely (single-pass iteration detected)";
  return "O(1) to O(log n) likely (no clear linear scan detected)";
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
      (line.startsWith("-") || line.startsWith("•") || line.includes("project")) &&
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
