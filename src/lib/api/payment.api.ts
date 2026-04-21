import { http } from "@/lib/api/http";

export async function createPayment() {
  return http<unknown>("/api/payment", {
    method: "POST",
  });
}
