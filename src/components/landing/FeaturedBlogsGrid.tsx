"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import BlogCard from "@/components/blogs/BlogCard";

gsap.registerPlugin(ScrollTrigger);

interface FeaturedBlogsGridProps {
  blogs: any[];
  locale: string;
}

export default function FeaturedBlogsGrid({ blogs, locale }: FeaturedBlogsGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = containerRef.current?.querySelectorAll(".blog-card-wrapper");
      if (!cards || cards.length === 0) return;

      gsap.from(cards, {
        opacity: 0,
        y: 60,
        rotation: -2,
        scale: 0.9,
        duration: 1.2,
        stagger: {
          amount: 0.4,
          ease: "power2.out",
        },
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3"
    >
      {blogs.map((blog) => (
        <div key={blog.id} className="blog-card-wrapper h-full">
          <BlogCard
            blog={blog}
            locale={locale}
            skipEntranceAnimation={true}
          />
        </div>
      ))}
    </div>
  );
}
