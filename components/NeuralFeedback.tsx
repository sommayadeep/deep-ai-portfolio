"use client";

const logs = [
  {
    source: "Collaboration Log // Startup Founder",
    text: "Delivered a production-ready MVP in two weeks with clean API boundaries and clear deployment docs."
  },
  {
    source: "Team Log // Hackathon Teammate",
    text: "Handled full-stack integration under pressure and kept the architecture stable while we iterated fast."
  },
  {
    source: "Mentor Log // Engineering Review",
    text: "Strong systems thinking. Explains tradeoffs clearly and ships decisions with measurable outcomes."
  }
];

export default function NeuralFeedback() {
  return (
    <section id="neural-feedback" className="glass rounded-2xl p-6">
      <p className="panel-title text-xs text-cyan-200/70">Neural Feedback</p>
      <h2 className="mt-2 text-2xl text-white">Collaboration System Logs</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {logs.map((item) => (
          <article key={item.source} className="rounded-xl border border-cyan-200/20 bg-[#0a1230]/85 p-4">
            <p className="text-[11px] uppercase tracking-widest text-cyan-200/70">{item.source}</p>
            <p className="mt-2 text-sm text-blue-100">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
