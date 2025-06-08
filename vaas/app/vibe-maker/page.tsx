"use client";

import VibeMaker from "@/components/VibeMaker";
import React from "react";

export default function VibeMakerPage() {
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

      {/* Content */}
      <main className="flex-grow grid place-items-center p-6 md:p-8">
        <div className="w-full max-w-3xl">
          <VibeMaker />
        </div>
      </main>
    </div>
  );
}
