import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return NextResponse.json({ repoCount: 0, source: "fallback" });
    }

    const data = await response.json();
    return NextResponse.json({
      repoCount: data.public_repos ?? 0,
      followers: data.followers ?? 0,
      source: "github"
    });
  } catch {
    return NextResponse.json({ repoCount: 0, source: "fallback" });
  }
}
