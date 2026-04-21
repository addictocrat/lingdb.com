import { http } from "@/lib/api/http";

export async function redeemCoupon(code: string) {
  return http<unknown>("/api/coupons/redeem", {
    method: "POST",
    body: { code },
  });
}

export async function listAdminCoupons() {
  return http<unknown[]>("/api/admin/coupons");
}

export async function createAdminCoupon(payload: {
  code: string;
  maxUses: number;
  expiresAt?: string;
}) {
  return http<unknown>("/api/admin/coupons", {
    method: "POST",
    body: payload,
  });
}

export async function deleteAdminCoupon(id: string) {
  return http<unknown>(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
