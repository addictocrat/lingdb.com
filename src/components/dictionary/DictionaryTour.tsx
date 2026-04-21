"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { patchUserProfile } from "@/lib/api/auth.api";

interface DictionaryTourProps {
  hasCompletedTour: boolean;
  userId: string;
}

export default function DictionaryTour({
  hasCompletedTour,
  userId,
}: DictionaryTourProps) {
  const t = useTranslations("dictionary_tutorial");
  const driverObj = useRef<Driver | null>(null);
  const queryClient = useQueryClient();
  void userId;

  const completeTourMutation = useMutation({
    mutationFn: () => patchUserProfile({ hasCompletedDictTour: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  const handleTourComplete = useCallback(async () => {
    localStorage.setItem("lingdb_dict_tour_completed", "true");

    try {
      await completeTourMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to save dictionary tour completion status", error);
    }
  }, [completeTourMutation]);

  useEffect(() => {
    // Only run the tour if the user hasn't completed it and we're on the client
    if (hasCompletedTour || typeof window === "undefined") return;

    // Check localStorage as well for immediate client-side feedback
    const localCompleted = localStorage.getItem("lingdb_dict_tour_completed");
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
          element: "#add-word-section",
          popover: {
            title: t("step1_title"),
            description: t("step1_desc"),
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#magic-words-section",
          popover: {
            title: t("step2_title"),
            description: t("step2_desc"),
            side: "top",
            align: "start",
          },
        },
        {
          element: "#dictionary-tabs",
          popover: {
            title: t("step3_title"),
            description: t("step3_desc"),
            side: "top",
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
