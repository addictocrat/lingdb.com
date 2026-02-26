"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Calendar, User, ArrowRight } from "lucide-react";
import type { Blog } from "@/lib/db/schema";

interface BlogCardProps {
  blog: Blog & { author?: { username: string | null } };
  locale: string;
}

export default function BlogCard({ blog, locale }: BlogCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30, rotation: -2 },
      { opacity: 1, y: 0, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
    );
  }, []);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.02,
      rotation: 1,
      boxShadow: "0 20px 40px rgba(var(--primary-500-rgb), 0.15)",
      duration: 0.4,
      ease: "power2.out",
    });
    gsap.to(titleRef.current, {
      color: "var(--primary-500)",
      y: -2,
      duration: 0.3,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      scale: 1,
      rotation: 0,
      boxShadow: "0 0px 0px rgba(0,0,0,0)",
      duration: 0.4,
      ease: "power2.inOut",
    });
    gsap.to(titleRef.current, {
      color: "inherit",
      y: 0,
      duration: 0.3,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border-2 border-[var(--border-color)] bg-[var(--surface)] p-6 transition-colors hover:border-primary-500/50"
    >
      {/* Goofy background shapes */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-500/5 transition-transform group-hover:scale-150" />

      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-bold text-primary-600">
          <Calendar className="h-3 w-3" />
          {new Date(blog.createdAt).toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        {blog.keywords && (
          <div className="flex gap-1">
            {blog.keywords
              .split(",")
              .slice(0, 2)
              .map((kw) => (
                <span
                  key={kw}
                  className="inline-block max-w-[14ch] truncate whitespace-nowrap overflow-hidden rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-500"
                >
                  {kw.trim().slice(0, 14)}
                </span>
              ))}
          </div>
        )}
      </div>

      <Link href={`/${locale}/blogs/${blog.slug}`} className="flex-1">
        <h3
          ref={titleRef}
          className="mb-3 text-2xl font-black leading-tight tracking-tight"
        >
          {blog.title}
        </h3>
        <p className="line-clamp-3 text-lg leading-relaxed text-[var(--fg)]/60">
          {blog.description}
        </p>
      </Link>

      <div className="mt-6 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center gap-2 text-sm text-[var(--fg)]/40">
          <User className="h-4 w-4" />
          <span className="font-semibold">
            {blog.author?.username || "Lingdb Team"}
          </span>
        </div>
        <Link
          href={`/${locale}/blogs/${blog.slug}`}
          className="flex items-center gap-1 font-bold text-primary-500 transition-all hover:gap-2"
        >
          Read More
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
