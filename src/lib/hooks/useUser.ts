"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getUserProfileBySupabaseId } from "@/lib/api/auth.api";
import { qk } from "@/lib/tanstack/query-keys";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  locale: string;
  tier: "FREE" | "PREMIUM";
  aiCredits: number;
  totalWords: number;
  totalFlashcards: number;
  totalQuizzes: number;
  streakCount: number;
  hasCompletedTour: boolean;
  role: "USER" | "ADMIN";
}

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch,
  } = useQuery<UserProfile | null>({
    queryKey: user
      ? qk.auth.profile(user.id)
      : ["auth", "profile", "anonymous"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const data = await getUserProfileBySupabaseId(user.id);
      return data.profile;
    },
    staleTime: 30_000,
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: ["auth"] });
    },
  });

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await refetch();
    }
  }, [user?.id, refetch]);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.id) {
        queryClient.invalidateQueries({
          queryKey: qk.auth.profile(currentUser.id),
        });
      } else {
        queryClient.removeQueries({ queryKey: ["auth"] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };

  const isLoading = isAuthLoading || (Boolean(user?.id) && isProfileLoading);

  return { user, profile: profile ?? null, isLoading, signOut, refreshProfile };
}
