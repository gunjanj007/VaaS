"use client";

import VibeMaker from "@/components/VibeMaker";
import VibeTransform from "@/components/VibeTransform";

export default function Home() {
  // front-end status log
  if (typeof window !== "undefined") {
    console.log(
      "%c🌐 Frontend ready",
      "color:lightgreen;font-weight:bold;",
      "Backend URL:",
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5050"
    );
  }
  return (
    <div className="bg-slate-900 min-h-screen font-sans text-slate-200 flex flex-col antialiased">
      {/* Header */}
      <header className="py-4 px-6 md:px-8 border-b border-slate-800 sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
              VaaS
            </span>
            <span className="hidden md:inline-block text-sm text-slate-500">
              Vibe as a Service
            </span>
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-800">
        {/* Left: Vibe Maker */}
        <div className="bg-slate-900 p-6 md:p-8 overflow-y-auto">
          <VibeMaker />
        </div>

        {/* Right: Vibe Transform */}
        <div className="bg-slate-950/50 p-6 md:p-8 overflow-y-auto">
          <VibeTransform />
        </div>
      </main>
    </div>
  );
}
