'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current) return;

    // Entrance animation for content children
    // We target direct top-level children to ensure they animate as blocks 
    // and avoid double-animating nested elements like <li> within <ul>
    const elements = contentRef.current.children;
    
    if (elements.length === 0) return;

    // Set initial state (hidden and slightly offset)
    gsap.set(elements, { 
      opacity: 0, 
      y: 20,
      scale: 0.99,
    });

    // Use ScrollTrigger.batch to stagger elements that enter the viewport at the same time
    // This is much more efficient and smoother than individual triggers for every element
    ScrollTrigger.batch(elements, {
      start: 'top 80%',
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        stagger: {
          each: 0.15,
          from: "start"
        },
        ease: 'power3.out',
        overwrite: true
      }),
      // Play only once for a natural reading flow
      once: true
    });
  }, { dependencies: [content], scope: contentRef });

  return (
    <div 
      ref={contentRef}
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
