// src/app/page.tsx

import Hero from "@/components/hero";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-black transition-colors dark:bg-[#050816] dark:text-white">
      <Navbar />

      <section className="relative">
        {/* Background Glow */}
        <div className="absolute left-1/2 top-32 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl dark:bg-cyan-400/10" />

        <Hero />
      </section>
    </main>
  );
}