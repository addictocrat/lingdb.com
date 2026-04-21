"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function FullscreenLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const logo = document.querySelector("#header-logo") as HTMLElement;
      const header = document.querySelector("header");
      const logoWrap = document.querySelector("#logo-wrap") as HTMLElement;
      if (!logo || !header || !logoWrap) return;

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

      // Pin the logo and prepare the stroked/loading-bar effect
      gsap.set(logo, {
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        margin: 0,
        zIndex: 60,
        // Loading bar text effect - reduced weight to prevent "over-bolding"
        webkitTextStroke: "0.8px #1a1a1a",
        backgroundImage: "linear-gradient(to right, #1a1a1a 50%, transparent 50%)",
        backgroundSize: "200% 100%",
        backgroundPosition: "100% 0",
        webkitBackgroundClip: "text",
        webkitTextFillColor: "transparent",
      });

      // Pin header above loader but keep it visually invisible (transparent background/border)
      tl.set(header, { 
        zIndex: 60, 
        backgroundColor: "transparent", 
        borderBottomColor: "transparent" 
      }, 0);
      const otherElements = header.querySelectorAll("nav, .flex.items-center.gap-3");
      tl.set(otherElements, { opacity: 0 }, 0);

      // Animation: The "Loading Bar" fill effect with a "weird" overshoot ease
      tl.to(logo, {
        backgroundPosition: "0% 0",
        duration: 1.2,
        ease: "expo.inOut",
      }, 0);

      // Initial centered state for the movement animation
      tl.set(logo, {
        xPercent: -50,
        yPercent: -50,
        left: "50vw",
        top: "50vh",
        scale: 1.5,
        transformOrigin: "center center",
        webkitTextStrokeWidth: "0.4px", // Extremely thin to match natural weight
        webkitTextStrokeColor: "var(--fg)",
        webkitTextFillColor: "transparent",
      }, 0);

      // 3. Animate BACK to the pinned navbar position explicitly
      // Using .to provides more reliable interpolation to 0px stroke
      tl.to(logo, {
        duration: 1.2,
        left: rect.left,
        top: rect.top,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        webkitTextStrokeWidth: "0px",
        webkitTextFillColor: "var(--fg)",
        ease: "power4.inOut",
      }, 1.2);

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
        className="absolute inset-0 bg-white pointer-events-auto"
      />
      {/* 
        We don't put the logo here because we are animating the ACTUAL navbar logo.
        This provides the "returning back smoothly" effect requested.
      */}
    </div>
  );
}
