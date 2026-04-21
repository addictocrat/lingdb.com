"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "next-themes";

export default function FullscreenLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useGSAP(
    () => {
      const logo = document.querySelector("#header-logo") as HTMLElement;
      const header = document.querySelector("header");
      const logoWrap = document.querySelector("#logo-wrap") as HTMLElement;
      const logoText = logo?.querySelector("span");
      const logoIcon = logo?.querySelector("img");
      if (!logo || !header || !logoWrap) return;

      const isDark = resolvedTheme === "dark" || 
        (!resolvedTheme && typeof window !== "undefined" && (
          document.documentElement.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ));
      const strokeColor = isDark ? "white" : "black";

      // 1. Measure the natural position and dimensions before movement
      const rect = logo.getBoundingClientRect();

      // Lock scroll
      document.body.style.overflow = "hidden";

      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          document.body.style.overflow = "";
          // Revert all temporary styles to restore natural flow
          gsap.set([header, logo, logoWrap], { clearProps: "all" });
          gsap.set(header.querySelectorAll("nav, .flex.items-center.gap-3"), { clearProps: "opacity" });
        },
      });

      // 2. stabilize the navbar by giving the wrapper the same width as the logo
      // this prevents the other nav items from shifting while logo is fixed
      gsap.set(logoWrap, { width: rect.width, height: rect.height });

      // Pin the logo 
      gsap.set(logo, {
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        margin: 0,
        zIndex: 60,
      });

      // Prepare the stroked/loading-bar effect on text
      if (logoText) {
        gsap.set(logoText, {
          display: "inline-block",
          webkitTextStroke: `0.8px ${strokeColor}`,
          backgroundImage: `linear-gradient(to right, ${strokeColor} 50%, transparent 50%)`,
          backgroundSize: "200% 100%",
          backgroundPosition: "100% 0",
          webkitBackgroundClip: "text",
          webkitTextFillColor: "transparent",
        });
      }

      // Hide icon initially for a cleaner logo reveal
      if (logoIcon) {
        gsap.set(logoIcon, { opacity: 0, scale: 0.8 });
      }

      // Pin header above loader but keep it visually invisible (transparent background/border)
      tl.set(header, { 
        zIndex: 60, 
        backgroundColor: "transparent", 
        borderBottomColor: "transparent" 
      }, 0);
      const otherElements = header.querySelectorAll("nav, .flex.items-center.gap-3");
      tl.set(otherElements, { opacity: 0 }, 0);

      // Animation: The "Loading Bar" fill effect
      if (logoText) {
        tl.to(logoText, {
          backgroundPosition: "0% 0",
          duration: 1.2,
          ease: "expo.inOut",
        }, 0);
      }

      // Reveal the icon alongside the text fill
      if (logoIcon) {
        tl.to(logoIcon, {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }, 0.4);
      }

      // Initial centered state for the movement animation
      tl.set(logo, {
        xPercent: -50,
        yPercent: -50,
        left: "50vw",
        top: "50vh",
        scale: 1.5,
        transformOrigin: "center center",
      }, 0);

      if (logoText) {
        tl.set(logoText, {
          webkitTextStrokeWidth: "0.4px", // Extremely thin to match natural weight
          webkitTextStrokeColor: strokeColor,
          webkitTextFillColor: "transparent",
        }, 0);
      }

      // 3. Animate BACK to the pinned navbar position explicitly
      tl.to(logo, {
        duration: 1.2,
        left: rect.left,
        top: rect.top,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        ease: "power4.inOut",
      }, 1.2);

      if (logoText) {
        tl.to(logoText, {
          webkitTextStrokeWidth: "0px",
          webkitTextFillColor: "var(--fg)",
          duration: 1.2,
          ease: "power4.inOut",
        }, 1.2);
      }

      // Restore border and background as animation starts
      tl.to(header, {
        borderBottomColor: "var(--border-color)",
        duration: 0.2,
      }, 1.2);

      // 4. Fade out loader background and restore header items
      tl.to(
        bgRef.current,
        {
          opacity: 0,
          duration: 1.0,
          ease: "power2.inOut",
        },
        1.4
      )
      .to(
        otherElements,
        {
          opacity: 1,
          duration: 0.5,
        },
        "-=0.5"
      );

      return () => {
        document.body.style.overflow = "";
        gsap.set([header, logo], { clearProps: "all" });
        if (logoText) gsap.set(logoText, { clearProps: "all" });
        if (logoIcon) gsap.set(logoIcon, { clearProps: "all" });
        gsap.set(header.querySelectorAll("nav, .flex.items-center.gap-3"), { clearProps: "opacity" });
      };
    },
    { scope: container }
  );

  if (!isVisible) return null;

  return (
    <div
      ref={container}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 bg-[var(--bg)] pointer-events-auto"
      />
      {/* 
        We don't put the logo here because we are animating the ACTUAL navbar logo.
        This provides the "returning back smoothly" effect requested.
      */}
    </div>
  );
}
