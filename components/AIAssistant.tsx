"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous?: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
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

function architectureBrief() {
  return "This portfolio runs as a layered AI system: a Next.js orchestration shell, interactive Three.js neural visualization, explainable client AI modules, and project-level engineering proof with architecture diagrams, tradeoffs, and metrics.";
}

function voiceErrorMessage(code?: string) {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone permission blocked. Allow mic access in browser site settings and try again.";
  }
  if (code === "no-speech") {
    return "No speech detected. Click Voice control and speak right away.";
  }
  if (code === "audio-capture") {
    return "No microphone found. Connect/enable a mic and retry.";
  }
  if (code === "network") {
    return "Speech service network error. Check internet and retry.";
  }
  return `Voice command failed${code ? ` (${code})` : ""}. Try again.`;
}

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [recognitionCtor, setRecognitionCtor] = useState<SpeechCtor | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello. I am DEEP.AI. Ask me about projects, project links, or what is behind any project."
    }
  ]);

  useEffect(() => {
    setIsHydrated(true);
    const ctor =
      (window as Window & { webkitSpeechRecognition?: SpeechCtor; SpeechRecognition?: SpeechCtor }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: SpeechCtor; SpeechRecognition?: SpeechCtor }).webkitSpeechRecognition ||
      null;
    setRecognitionCtor(() => ctor);
  }, []);

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

  function handleVoiceCommand(transcript: string) {
    const normalized = transcript.toLowerCase();
    const map: Array<[string, string]> = [
      ["ai tools", "ai-tools"],
      ["engineering", "engineering-proof"],
      ["deployments", "ai-deployments"],
      ["connect", "connect-protocol"],
      ["architecture", "core-architecture"]
    ];

    const match = map.find(([command]) => normalized.includes(command));
    if (match) {
      const target = document.getElementById(match[1]);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setChat((prev) => [...prev, { role: "assistant", content: `Voice command executed: opened ${match[1]}.` }]);
        return;
      }
    }

    setMessage(transcript);
  }

  async function startVoiceControl() {
    if (!recognitionCtor || isListening) return;

    const runningOnLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !runningOnLocalhost) {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Voice control requires HTTPS (or localhost) to access microphone APIs."
        }
      ]);
      return;
    }

    if (!navigator.onLine) {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "You appear offline. Voice recognition needs internet for the browser speech service."
        }
      ]);
      return;
    }

    const permissionsApi = navigator.permissions;
    if (permissionsApi?.query) {
      try {
        const result = await permissionsApi.query({ name: "microphone" as PermissionName });
        if (result.state === "denied") {
          setChat((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Microphone access is denied. Enable mic permission for this site and retry."
            }
          ]);
          return;
        }
      } catch {
        // Ignore permission-query errors. Browser support varies.
      }
    }

    const recognition = new recognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChat((prev) => [...prev, { role: "user", content: `[voice] ${transcript}` }]);
      handleVoiceCommand(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setChat((prev) => [...prev, { role: "assistant", content: voiceErrorMessage(event.error) }]);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setChat((prev) => [...prev, { role: "assistant", content: "Voice engine start failed. Retry in Chrome on localhost with mic permission enabled." }]);
    }
  }

  return (
    <div className="assistant-glow glass fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="panel-title text-xs text-cyan-200">DEEP.AI Assistant</p>
        <button
          onClick={() => setIsMinimized((v) => !v)}
          className="ripple-btn rounded-md border border-cyan-200/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-100"
        >
          {isMinimized ? "Open" : "Minimize"}
        </button>
      </div>

      {!isMinimized ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              className="ripple-btn rounded-full border border-cyan-200/20 bg-[#0d1738] px-3 py-1 text-[11px] text-cyan-100"
              onClick={() =>
                setChat((prev) => [...prev, { role: "assistant", content: architectureBrief() }])
              }
            >
              Explain portfolio architecture
            </button>
            <button
              className="ripple-btn rounded-full border border-cyan-200/20 bg-[#0d1738] px-3 py-1 text-[11px] text-cyan-100"
              onClick={startVoiceControl}
              disabled={!isHydrated || !recognitionCtor || isListening}
            >
              {isListening ? "Listening..." : "Voice control"}
            </button>
          </div>
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
              className="ripple-btn rounded-lg border border-cyan-200/25 bg-cyan-400/15 px-3 py-2 text-xs font-medium text-cyan-100"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
