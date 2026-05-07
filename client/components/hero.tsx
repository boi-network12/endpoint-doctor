// components hero.tsx

"use client";

import { Globe, Server, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Hero() {
  const [active, setActive] = useState<"frontend" | "backend">("frontend");

  return (
    <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center justify-center px-6 py-24">
      {/* Floating Blur */}
      <div className="absolute right-10 top-32 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Badge */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <Sparkles className="h-4 w-4 text-cyan-500" />
        AI Powered Diagnostics Platform
      </div>

      {/* Heading */}
      <h1 className="max-w-5xl text-center text-5xl font-black leading-tight tracking-tight sm:text-7xl">
        Understand Why Your{" "}
        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Website
        </span>{" "}
        or{" "}
        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          API
        </span>{" "}
        Is Slow
      </h1>

      {/* Description */}
      <p className="mt-8 max-w-2xl text-center text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Analyze frontend performance, backend endpoints, rendering bottlenecks,
        API latency, caching problems, and network issues in real time.
      </p>

      {/* Liquid Glass Tabs */}
      <div className="mt-10 flex items-center gap-3 rounded-full border border-black/10 bg-white/40 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <button
          onClick={() => setActive("frontend")}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
            active === "frontend"
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          <Globe className="h-4 w-4" />
          Frontend Testing
        </button>

        <button
          onClick={() => setActive("backend")}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
            active === "backend"
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          <Server className="h-4 w-4" />
          Backend Testing
        </button>
      </div>

      {/* Search Box */}
      <div className="mt-10 w-full max-w-4xl rounded-[2rem] border border-black/10 bg-white/60 p-4 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder={
              active === "frontend"
                ? "Enter website URL..."
                : "Enter API endpoint..."
            }
            className="h-16 flex-1 rounded-2xl border border-black/10 bg-black/[0.03] px-6 text-lg outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.03]"
          />

          <button className="h-16 rounded-2xl bg-cyan-500 px-8 text-lg font-semibold text-white transition hover:scale-[1.02] hover:bg-cyan-400">
            Analyze Now
          </button>
        </div>

        {/* Fake Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Avg Response Time</p>
            <h3 className="mt-2 text-2xl font-bold">1.4s</h3>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Detected Bottlenecks</p>
            <h3 className="mt-2 text-2xl font-bold">12 Issues</h3>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Performance Score</p>
            <h3 className="mt-2 text-2xl font-bold text-cyan-500">92/100</h3>
          </div>
        </div>
      </div>
    </div>
  );
}