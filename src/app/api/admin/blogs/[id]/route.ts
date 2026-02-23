import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, blogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const blogUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  keywords: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      with: {
        author: {
          columns: { username: true, email: true }
        }
      }
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error('Get blog error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const body = await request.json();
    const result = blogUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', issues: result.error.issues },
        { status: 400 }
      );
    }

    const currentBlog = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
    });

    if (!currentBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const updates = { ...result.data, updatedAt: new Date() };
    
    // Set publishedAt if status is changing to PUBLISHED
    if (result.data.status === 'PUBLISHED' && currentBlog.status !== 'PUBLISHED') {
      (updates as any).publishedAt = new Date();
    }

    const [updatedBlog] = await db
      .update(blogs)
      .set(updates)
      .where(eq(blogs.id, id))
      .returning();

    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('Update blog error:', error);
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(blogs)
      .where(eq(blogs.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
