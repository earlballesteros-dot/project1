"use client";

import dynamic from "next/dynamic";
import type { BeamsProps } from "@/components/beams";

/**
 * Client Component wrapper for dynamically loading the heavy Three.js Beams
 * animation with `ssr: false` in Next.js App Router.
 *
 * This defers loading Three.js and React Three Fiber chunks until after initial
 * page hydration, preventing them from blocking the homepage critical rendering path.
 */
const Beams = dynamic(
  () => import("@/components/beams").then((mod) => mod.Beams),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full pointer-events-none"
        aria-hidden="true"
      />
    ),
  }
);

export function HeroBeams(props: BeamsProps) {
  return <Beams {...props} />;
}

export default HeroBeams;
