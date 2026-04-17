"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TOOLTIP_POSITIONS, type TooltipPosition } from "@/lib/constants/ui";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: TooltipPosition;
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900 animate-in fade-in duration-150",
            TOOLTIP_POSITIONS[position],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
