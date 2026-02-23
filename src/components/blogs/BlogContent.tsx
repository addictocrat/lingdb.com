'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Entrance animation for content children
    const elements = contentRef.current.querySelectorAll('h2, h3, p, ul, ol, table, blockquote, img, pre');
    
    gsap.fromTo(
      elements,
      { 
        opacity: 0, 
        y: 40,
        scale: 0.98,
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 1, 
        stagger: 0.15, 
        ease: 'elastic.out(1, 0.8)',
        delay: 0.2
      }
    );
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
