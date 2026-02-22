import { NextResponse } from "next/server";

function sumRecentContributions(events: Array<{ type?: string; payload?: { commits?: Array<unknown> } }>) {
  let contributionCount = 0;
  for (const event of events) {
    if (event.type === "PushEvent") {
      contributionCount += event.payload?.commits?.length ?? 1;
      continue;
    }
    if (event.type === "PullRequestEvent" || event.type === "IssuesEvent" || event.type === "IssueCommentEvent") {
      contributionCount += 1;
    }
  }
  return contributionCount;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  try {
    const headers = { Accept: "application/vnd.github+json" };
    const [profileResponse, eventsResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers,
        next: { revalidate: 3600 }
      }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
        headers,
        next: { revalidate: 900 }
      })
    ]);

    if (!profileResponse.ok) {
      return NextResponse.json({ repoCount: 0, followers: 0, contributions30d: 0, source: "fallback" });
    }

    const data = await profileResponse.json();
    const events = eventsResponse.ok ? await eventsResponse.json() : [];
    const contributions30d = Array.isArray(events) ? sumRecentContributions(events) : 0;

    return NextResponse.json({
      repoCount: data.public_repos ?? 0,
      followers: data.followers ?? 0,
      contributions30d,
      source: "github"
    });
  } catch {
    return NextResponse.json({ repoCount: 0, followers: 0, contributions30d: 0, source: "fallback" });
  }
}
