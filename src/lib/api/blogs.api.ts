import { http } from "@/lib/api/http";

export async function getAdminBlogs() {
  return http<unknown[]>("/api/admin/blogs");
}
