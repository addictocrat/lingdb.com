import { QueryClient } from "@tanstack/react-query";

export function makeServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });
}
