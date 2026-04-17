"use client";

import { useTheme } from "next-themes";
import DotGrid from "@/components/ui/DotGrid";
import { useEffect, useState } from "react";

export default function AppBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <DotGrid
        dotSize={4}
        gap={25}
        baseColor={isDark ? "#0000d886" : "rgba(0, 0, 216, 0.2)"}
        activeColor="#0001D8"
        proximity={110}
        shockRadius={200}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />
    </div>
  );
}
