"use client";

import { useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="underline text-cyan-200">
          {part}
        </a>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello. I am DEEP.AI. Ask me about projects, project links, or what is behind any project."
    }
  ]);

  async function sendMessage() {
    const prompt = message.trim();
    if (!prompt || isLoading) return;

    setMessage("");
    setIsLoading(true);
    setChat((prev) => [...prev, { role: "user", content: prompt }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const answer =
        typeof data?.answer === "string" && data.answer.trim()
          ? data.answer
          : "I could not parse that request. Ask again.";

      setChat((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "Network issue detected. Please retry in a moment." }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="panel-title text-xs text-cyan-200">DEEP.AI Assistant</p>
        <button
          onClick={() => setIsMinimized((v) => !v)}
          className="rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-100"
        >
          {isMinimized ? "Open" : "Minimize"}
        </button>
      </div>

      {!isMinimized ? (
        <>
          <div className="mb-3 max-h-52 space-y-2 overflow-y-auto pr-1">
            {chat.map((entry, index) => (
              <p
                key={`${entry.role}-${index}`}
                className={`rounded-lg px-3 py-2 text-sm ${
                  entry.role === "assistant"
                    ? "bg-[#0b1330] text-blue-100"
                    : "bg-cyan-400/15 text-cyan-100"
                }`}
              >
                {renderTextWithLinks(entry.content)}
              </p>
            ))}
            {isLoading ? <p className="text-xs text-cyan-200/80">Thinking...</p> : null}
          </div>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask anything about Sommayadeep..."
              className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1330] px-3 py-2 text-sm outline-none placeholder:text-blue-200/45 focus:border-cyan-300/50"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={isLoading}
              className="rounded-lg border border-cyan-200/25 bg-cyan-400/15 px-3 py-2 text-xs font-medium text-cyan-100"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
