"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { patchUserProfile } from "@/lib/api/auth.api";

interface OnboardingTourProps {
  hasCompletedTour: boolean;
  userId: string;
}

export default function OnboardingTour({
  hasCompletedTour,
  userId,
}: OnboardingTourProps) {
  const t = useTranslations("tutorial");
  const driverObj = useRef<Driver | null>(null);
  const queryClient = useQueryClient();
  void userId;

  const completeTourMutation = useMutation({
    mutationFn: () => patchUserProfile({ hasCompletedTour: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  const handleTourComplete = async () => {
    localStorage.setItem("lingdb_tour_completed", "true");

    try {
      await completeTourMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to save tour completion status", error);
    }
  };

  useEffect(() => {
    // Only run the tour if the user hasn't completed it and we're on the client
    if (hasCompletedTour || typeof window === "undefined") return;

    // Check localStorage as well for immediate client-side feedback
    const localCompleted = localStorage.getItem("lingdb_tour_completed");
    if (localCompleted === "true") return;

    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0.75)",
      nextBtnText: t("next_btn"),
      prevBtnText: t("prev_btn"),
      doneBtnText: t("done_btn"),
      steps: [
        {
          popover: {
            title: t("welcome_title"),
            description: t("welcome_desc"),
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#dictionary-grid",
          popover: {
            title: t("library_title"),
            description: t("library_desc"),
            side: "top",
            align: "start",
          },
        },
        {
          element: "#profile-nav-link",
          popover: {
            title: t("profile_title"),
            description: t("profile_desc"),
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tiers-nav-link",
          popover: {
            title: t("premium_title"),
            description: t("premium_desc"),
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#create-dictionary-btn",
          popover: {
            title: t("create_title"),
            description: t("create_desc"),
            side: "bottom",
            align: "start",
          },
        },
      ],
      onDestroyed: () => {
        handleTourComplete();
      },
    });

    // Start the tour after a short delay
    const timer = setTimeout(() => {
      driverObj.current?.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasCompletedTour, handleTourComplete, t]);

  return null; // This component doesn't render anything itself
}
