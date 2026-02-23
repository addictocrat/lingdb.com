import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const generateBlogSchema = z.object({
  prompt: z.string().min(10),
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

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const result = generateBlogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { prompt } = result.data;

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert blogger and SEO specialist for Lingdb. Generate a high-quality blog post based on the user's prompt.
            
            Return ONLY a valid JSON object with the following structure:
            {
              "title": "Main title of the blog",
              "slug": "url-friendly-slug",
              "description": "Short excerpt/description for lists",
              "keywords": "comma, separated, keywords",
              "content": "Full HTML content with <h2>, <p>, <strong>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td> etc.",
              "seoTitle": "SEO optimized title (max 60 chars)",
              "seoDescription": "SEO meta description (max 160 chars)",
              "schemaData": { 
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": "...",
                "description": "...",
                "keywords": "...",
                "author": { "@type": "Person", "name": "${admin.username}" }
              }
            }
            
            FORMATTING GUIDELINES:
            1. Use <h2> for section headers.
            2. Use <p> for paragraphs.
            3. CRITICAL: Use <table> for all word lists, vocabulary summaries, and grammar comparisons (e.g., comparing tenses, gender rules, or cases). Tables are preferred over long lists for clarity.
            4. Use <strong> for emphasis.
            5. The tone should be helpful, educational, and engaging.
            6. The blog should be detailed (at least 5-6 sections), accurate, and very well optimized for SEO.
            
            CRITICAL: Return ONLY raw JSON, no markdown fences.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Blog generation error:', errorText);
      return NextResponse.json({ error: 'Failed to generate blog content' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error('Failed to parse AI blog response:', content);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 });
    }
  } catch (error) {
    console.error('Blog generation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
