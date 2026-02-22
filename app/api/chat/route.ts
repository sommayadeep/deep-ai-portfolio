import { NextResponse } from "next/server";
import { profile } from "@/data/profile";

type Deployment = (typeof profile.deployments)[number];
type AssistantAction = {
  type: "scroll_to";
  targetId: string;
  highlight?: boolean;
};

function hasAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function findProject(prompt: string): Deployment | null {
  const text = prompt.toLowerCase();
  const promptCompact = text.replace(/[^a-z0-9]/g, "");
  const likelyProjectQuery = hasAny(text, [
    "project",
    "repo",
    "github",
    "link",
    "live",
    "deploy",
    "built",
    "behind",
    "architecture",
    "certitrust",
    "sugar",
    "trilingo",
    "student",
    "turbofan",
    "algoviz",
    "mahendra"
  ]);
  const labelsFor = (project: Deployment) =>
    [project.name, ...(project.aliases ?? [])].map((value) => value.toLowerCase());

  const exact = profile.deployments.find((project) => {
    const labels = labelsFor(project);
    return labels.some((label) => {
      const compact = label.replace(/[^a-z0-9]/g, "");
      return text.includes(label) || promptCompact.includes(compact);
    });
  });
  if (exact) return exact;

  // Fuzzy fallback for minor typos like "sugarshiels" -> "sugarshield".
  const words = text
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);
  const candidates = [...words];
  for (let i = 0; i < words.length - 1; i += 1) {
    candidates.push(`${words[i]}${words[i + 1]}`);
  }

  let best: { project: Deployment; distance: number } | null = null;
  for (const project of profile.deployments) {
    const labels = labelsFor(project).map((label) => label.replace(/[^a-z0-9]/g, ""));
    for (const compact of labels) {
      for (const candidate of candidates) {
        const d = levenshtein(candidate, compact);
        if (!best || d < best.distance) {
          best = { project, distance: d };
        }
      }
    }
  }
  if (likelyProjectQuery && best && best.distance <= 2) return best.project;

  return (
    null
  );
}

function localAnswer(prompt: string): string {
  const text = prompt.toLowerCase();
  const asksAboutOwner = hasAny(text, [
    "owner",
    "who made",
    "who built",
    "who are you",
    "about you",
    "your creator",
    "yourself",
    "tell me about yourself",
    "introduce yourself"
  ]);
  const asksAllProjectsDetailed = hasAny(text, [
    "describe all project",
    "describe all projects",
    "explain all project",
    "explain all projects",
    "tell me all projects",
    "all projects in detail"
  ]);
  const asksAllProjectsList = hasAny(text, [
    "all project",
    "all projects",
    "list project",
    "list projects",
    "show projects"
  ]);
  const matchedProject = findProject(prompt);
  const asksBehind = hasAny(text, [
    "behind",
    "how built",
    "how it works",
    "architecture",
    "explain project",
    "about this project"
  ]);

  if (asksAboutOwner) {
    return `${profile.name} is the owner and builder of this portfolio. ${profile.summary} Current focus: ${profile.title}.`;
  }

  if (asksAllProjectsDetailed) {
    return profile.deployments
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.name} (${p.type}) - ${p.impact} Behind it: ${p.behind} Repo: ${p.repoUrl}${p.liveUrl ? ` | Live: ${p.liveUrl}` : " | Live: Not Deployed Yet"}`
      )
      .join("\n");
  }

  if (matchedProject && asksBehind) {
    return `${matchedProject.name}: ${matchedProject.behind}`;
  }

  if (matchedProject && text.includes("tell me about")) {
    return `${matchedProject.name}: ${matchedProject.impact} Behind it: ${matchedProject.behind}`;
  }

  if (matchedProject && (text.includes("link") || text.includes("live") || text.includes("repo") || text.includes("github"))) {
    const livePart = matchedProject.liveUrl
      ? `Live: ${matchedProject.liveUrl}`
      : "Live: Not Deployed Yet";
    return `${matchedProject.name} -> Repo: ${matchedProject.repoUrl} | ${livePart}`;
  }

  if (text.includes("all links") || text.includes("all project links")) {
    return profile.deployments
      .map((p) => `${p.name} -> Repo: ${p.repoUrl} | Live: ${p.liveUrl || "Not Deployed Yet"}`)
      .join(" | ");
  }

  if (asksAllProjectsList || text.includes("project") || text.includes("deploy")) {
    const list = profile.deployments
      .map((p) => `${p.name} (Repo: ${p.repoUrl}${p.liveUrl ? `, Live: ${p.liveUrl}` : ", Live: Not Deployed Yet"})`)
      .join(" | ");
    return `Sommayadeep has ${profile.deployments.length} featured projects: ${list}`;
  }

  if (text.includes("cgpa")) {
    return `Current CGPA is ${profile.cgpa.toFixed(1)}+.`;
  }

  if (text.includes("github")) {
    return "GitHub: https://github.com/sommayadeep";
  }

  if (text.includes("linkedin") || text.includes("linked in")) {
    return "LinkedIn: https://www.linkedin.com/in/sommayadeep-saha-127baa335/";
  }

  if (text.includes("email") || text.includes("mail") || text.includes("contact")) {
    return "Email: sommayadeepsaha@gmail.com";
  }

  if (text.includes("skill") || text.includes("stack")) {
    const modules = profile.modules
      .map((m) => `${m.title}: ${m.items.join(", ")}`)
      .join(" | ");
    return `Core technical modules -> ${modules}`;
  }

  if (text.includes("blockchain")) {
    return "Blockchain work includes CertiTrust and smart-contract tooling with Solidity, Hardhat, and Web3.js.";
  }

  if (text.includes("trilingo")) {
    return "Trilingo is a language conversion project focused on practical multilingual communication.";
  }

  return "Ask me about projects, all project links, CGPA, skills, blockchain work, GitHub, LinkedIn, or what is behind a project.";
}

function detectUiActions(prompt: string): AssistantAction[] {
  const text = prompt.toLowerCase();
  const actions: AssistantAction[] = [];
  const push = (targetId: string) => {
    if (!actions.some((action) => action.targetId === targetId)) {
      actions.push({ type: "scroll_to", targetId, highlight: true });
    }
  };

  if (hasAny(text, ["sentiment", "complexity", "resume analyzer", "neuralhire", "ai tools"])) push("ai-tools");
  if (hasAny(text, ["engineering proof", "deep dive", "architecture", "research log"])) push("engineering-proof");
  if (hasAny(text, ["connect", "contact", "email", "linkedin", "github node"])) push("connect-protocol");
  if (hasAny(text, ["metrics", "dashboard", "mission control", "status"])) push("mission-control");

  const projectMatch = findProject(prompt);
  if (projectMatch || hasAny(text, ["deployment", "deployments", "project", "projects", "live link", "repo"])) {
    push("ai-deployments");
  }

  return actions;
}

export async function POST(req: Request) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = String(body?.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json(
        { answer: "Send a prompt in request body as { prompt }." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const hasValidApiKey =
      Boolean(apiKey) &&
      apiKey !== "your_openai_api_key" &&
      apiKey !== "sk-your-key-here";
    if (!hasValidApiKey) {
      return NextResponse.json({ answer: localAnswer(prompt), source: "local", actions: detectUiActions(prompt) });
    }

    const system = [
      "You are DEEP.AI assistant for Sommayadeep Saha's portfolio.",
      "Be concise and factual.",
      "Use these facts only:",
      `Name: ${profile.name}`,
      `Title: ${profile.title}`,
      `CGPA: ${profile.cgpa.toFixed(1)}+`,
      `GitHub: https://github.com/sommayadeep`,
      `LinkedIn: https://www.linkedin.com/in/sommayadeep-saha-127baa335/`,
      "Email: sommayadeepsaha@gmail.com",
      `Projects: ${profile.deployments
        .map(
          (p) =>
            `${p.name} | Repo: ${p.repoUrl} | Live: ${p.liveUrl || "Not Deployed Yet"} | Behind: ${p.behind}`
        )
        .join(" || ")}`,
      "If user asks for a specific project link, return direct repo/live URLs.",
      "If user asks what is behind a project, return its short technical explanation.",
      "If user asks for contact or email, return the exact email."
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json({ answer: localAnswer(prompt), source: "fallback", actions: detectUiActions(prompt) });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ answer: localAnswer(prompt), source: "fallback", actions: detectUiActions(prompt) });
    }

    return NextResponse.json({ answer, source: "openai", actions: detectUiActions(prompt) });
  } catch {
    const safeFallback = prompt
      ? localAnswer(prompt)
      : "Ask me about projects, links, CGPA, skills, GitHub, LinkedIn, or what is behind a project.";
    return NextResponse.json({ answer: safeFallback, source: "fallback-error", actions: detectUiActions(prompt) }, { status: 200 });
  }
}
