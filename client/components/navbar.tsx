// components navbar

"use client";

import { Activity, MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/40 backdrop-blur-xl dark:bg-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 backdrop-blur-md">
            <Activity className="h-5 w-5 text-cyan-500" />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Endpoint Doctor
            </h1>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Diagnose websites & APIs
            </p>
          </div>
        </div>

        <button
          onClick={() => setDark(!dark)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/50 backdrop-blur-xl transition hover:scale-105 dark:border-white/10 dark:bg-white/5"
        >
          {dark ? (
            <SunMedium className="h-5 w-5" />
          ) : (
            <MoonStar className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}