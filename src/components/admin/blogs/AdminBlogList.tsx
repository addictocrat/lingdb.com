"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { Edit2, Trash2, Eye, Search, FileText } from "lucide-react";
import type { Blog } from "@/lib/db/schema";
import { deleteAdminBlog } from "@/lib/api/admin.api";

interface AdminBlogListProps {
  initialBlogs: (Blog & { author?: { username: string | null } })[];
  locale: string;
}

export default function AdminBlogList({
  initialBlogs,
  locale,
}: AdminBlogListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [blogsList, setBlogsList] = useState(initialBlogs);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const deleteBlogMutation = useMutation({
    mutationFn: deleteAdminBlog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
  });

  const filteredBlogs = blogsList.filter(
    (blog) =>
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    setIsDeleting(id);
    try {
      await deleteBlogMutation.mutateAsync(id);

      setBlogsList((prev) => prev.filter((b) => b.id !== id));
      toast("Blog post deleted successfully", "success");
    } catch (error) {
      toast("Failed to delete blog post", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--fg)]/30" />
        <input
          type="text"
          placeholder="Search blogs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 pl-10 pr-4 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg)]/50">
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Author</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-[var(--fg)]/40"
                  >
                    <FileText className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="text-xl">No blogs found.</p>
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr
                    key={blog.id}
                    className="transition-colors hover:bg-[var(--bg)]/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold">{blog.title}</div>
                      <div className="text-sm text-[var(--fg)]/40">
                        /{blog.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider",
                          blog.status === "PUBLISHED"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-amber-500/10 text-amber-600",
                        )}
                      >
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--fg)]/60">
                      {blog.author?.username || "System"}
                    </td>
                    <td className="px-6 py-4 text-[var(--fg)]/60">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/${locale}/blogs/${blog.slug}`}
                          target="_blank"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Publicly"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/${locale}/admin/blogs/${blog.id}`}>
                          <Button variant="secondary" size="sm" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(blog.id)}
                          isLoading={isDeleting === blog.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
