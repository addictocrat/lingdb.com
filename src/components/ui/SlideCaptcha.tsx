'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SlideCaptchaProps {
  onVerify: (data: { verified: boolean; duration: number }) => void;
  className?: string;
  text?: string;
  successText?: string;
}

export default function SlideCaptcha({
  onVerify,
  className,
  text = 'Slide to verify',
  successText = 'Verified'
}: SlideCaptchaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientX: number) => {
    if (isVerified) return;
    setIsDragging(true);
    if (!startTimeRef.current) startTimeRef.current = Date.now();
  }, [isVerified]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || isVerified || !containerRef.current || !sliderRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerRect.width - sliderWidth - 4; // 4px for padding
    
    let newPosition = clientX - containerRect.left - sliderWidth / 2;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    setPosition(newPosition);

    if (newPosition >= maxPosition - 2) {
      setIsVerified(true);
      setIsDragging(false);
      setPosition(maxPosition);
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      onVerify({ verified: true, duration });
    }
  }, [isDragging, isVerified, onVerify]);

  const handleEnd = useCallback(() => {
    if (isVerified) return;
    setIsDragging(false);
    if (!isVerified) {
      setPosition(0);
    }
  }, [isVerified]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleEndEvent = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEndEvent);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEndEvent);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEndEvent);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEndEvent);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-14 w-full cursor-pointer select-none overflow-hidden rounded-xl bg-[var(--surface)] border border-[var(--border-color)] p-1 transition-all duration-300",
        isVerified ? "border-green-500/50 bg-green-500/10" : "hover:border-[var(--fg)]/20",
        className
      )}
    >
      {/* Background Text */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-medium transition-opacity duration-300",
          isVerified ? "text-green-600 dark:text-green-400" : "text-[var(--fg)]/40",
          isDragging ? "opacity-20" : "opacity-100"
        )}
      >
        {isVerified ? successText : text}
      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        style={{ transform: `translateX(${position}px)` }}
        className={cn(
          "absolute top-1 bottom-1 flex aspect-square h-[calc(100%-8px)] items-center justify-center rounded-lg shadow-sm transition-shadow",
          isVerified 
            ? "bg-green-500 text-white" 
            : "bg-primary-500 text-white hover:bg-primary-600 active:shadow-inner",
          !isDragging && !isVerified && "transition-transform duration-300"
        )}
      >
        {isVerified ? (
          <Check className="h-6 w-6" />
        ) : (
          <ChevronsRight className="h-6 w-6 animate-pulse-slow" />
        )}
      </div>

      {/* Success Progress Overlay */}
      <div 
        className={cn(
          "absolute left-1 top-1 bottom-1 -z-10 bg-green-500/20 transition-all rounded-lg",
          isVerified ? "right-1" : "left-1"
        )}
        style={{ width: isVerified ? 'calc(100% - 8px)' : `${position + 10}px`, opacity: position > 0 || isVerified ? 1 : 0 }}
      />
    </div>
  );
}
