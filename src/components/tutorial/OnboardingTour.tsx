'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface OnboardingTourProps {
  hasCompletedTour: boolean;
  userId: string;
}

export default function OnboardingTour({ hasCompletedTour, userId }: OnboardingTourProps) {
  const t = useTranslations('tutorial');
  const router = useRouter();
  const driverObj = useRef<any>(null);

  useEffect(() => {
    // Only run the tour if the user hasn't completed it and we're on the client
    if (hasCompletedTour || typeof window === 'undefined') return;

    // Check localStorage as well for immediate client-side feedback
    const localCompleted = localStorage.getItem('lingdb_tour_completed');
    if (localCompleted === 'true') return;

    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0,0,0,0.75)',
      steps: [
        {
          popover: {
            title: 'Welcome to Lingdb! 🚀',
            description: "Let's take a quick 1-minute tour to help you master any language.",
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#dictionary-grid',
          popover: {
            title: 'Your Library',
            description: 'All your personal dictionaries will appear here for easy access.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '#profile-nav-link',
          popover: {
            title: 'Your Profile',
            description: 'Track your learning streaks, stats, and manage your account settings here.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tiers-nav-link',
          popover: {
            title: 'Premium Features',
            description: 'Upgrade for unlimited AI credits, ad-free learning, and advanced stats.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#create-dictionary-btn',
          popover: {
            title: 'Create Your First Dictionary',
            description: 'Click here to start building your vocabulary list.',
            side: 'bottom',
            align: 'start'
          }
        }
      ],
      onDestroyed: () => {
        handleTourComplete();
      }
    });

    // Start the tour after a short delay
    const timer = setTimeout(() => {
      driverObj.current.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasCompletedTour]);

  const handleTourComplete = async () => {
    localStorage.setItem('lingdb_tour_completed', 'true');
    
    try {
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedTour: true })
      });
    } catch (error) {
      console.error('Failed to save tour completion status', error);
    }
  };

  return null; // This component doesn't render anything itself
}
