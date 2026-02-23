import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, blogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  content: z.any(), // JSON
  keywords: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  schemaData: z.any().optional(),
});

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  return dbUser?.role === 'ADMIN' ? dbUser : null;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const allBlogs = await db.query.blogs.findMany({
      orderBy: [desc(blogs.createdAt)],
      with: {
        author: {
          columns: { username: true, email: true }
        }
      }
    });

    return NextResponse.json(allBlogs);
  } catch (error) {
    console.error('List blogs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await request.json();
    const result = blogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { title, slug, description, content, keywords, status, seoTitle, seoDescription, schemaData } = result.data;

    const [newBlog] = await db.insert(blogs).values({
      title,
      slug,
      description,
      content,
      keywords,
      authorId: admin.id,
      status,
      seoTitle,
      seoDescription,
      schemaData,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    }).returning();

    return NextResponse.json(newBlog);
  } catch (error) {
    console.error('Create blog error:', error);
    // Check for unique constraint violation on slug
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
