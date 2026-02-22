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
        gap={64}
        baseColor={isDark ? "#1b1956" : "#dbdee4"}
        activeColor={isDark ? "#5a57a9" : "#585b8a"}
        proximity={120}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />
    </div>
  );
}
