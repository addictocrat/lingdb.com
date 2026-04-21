# Lingdb

Lingdb is a modern, full-stack language-learning platform inspired by Quizlet. It allows users to create multilingual dictionaries, manage word lists with drag-and-drop, and study using interactive flashcards and quiz tools. The app also features AI-powered word suggestions and example phrase generation. You can invite a friend to co-create a dictionary together!

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [GSAP v3.15](https://gsap.com/resources/React/)
- **Server State**: [TanStack Query](https://tanstack.com/query/latest) (client caching, invalidation, mutations, hydration)
- **Authentication**: [Supabase Auth](https://supabase.com/auth) (+ Google OAuth)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)

## 📦 Key Packages & Tools

| Package               | Purpose                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| **Zod**               | Runtime schema validation for API inputs and form data, ensuring type safety and data integrity.      |
| **Jest & Playwright** | A combination of unit/component testing (Jest) and End-to-End browser testing (Playwright).           |
| **Drizzle ORM**       | A lightweight, TypeScript-first ORM used for interacting with the PostgreSQL database.                |
| **TanStack Query**    | Handles server-state caching, query invalidation, mutation flows, and hydration for faster UX.        |
| **Inngest**           | Handles background processing, cron jobs, and event-driven workflows (e.g., sending reminder emails). |
| **OpenAI**            | Powers the AI word suggestions and example phrase generation features.                                |
| **next-intl**         | Manages the application's multi-language support (English, French, German, Spanish, Turkish).         |

## Data Fetching with TanStack Query

- Lingdb uses TanStack Query as the default client-side server-state layer.
- Use the shared query key factory in `src/lib/tanstack/query-keys.ts`.
- Use API wrappers in `src/lib/api/*` instead of direct component-level `fetch` calls.
- Use `useQuery` for reads and `useMutation` for writes.
- Invalidate only affected keys after mutations for predictable updates.
- Prefer hydrated initial data on pages that already fetch on the server.
- Query provider/client/defaults: `src/lib/tanstack/query-provider.tsx`, `src/lib/tanstack/query-client.ts`, `src/lib/tanstack/query-defaults.ts`
- Query keys: `src/lib/tanstack/query-keys.ts`
- Hydration helpers: `src/lib/tanstack/hydration.ts`

## 🛠️ Local Setup

### Prerequisites

- [pnpm](https://pnpm.io/) installed.
- A Supabase project for Auth and Database.
- An OpenRouter API key for AI features.

### Step-by-Step Instructions

1.  **Clone the repository**:

    ```bash
    git clone <your-repo-url>
    cd lingdbapp
    ```

2.  **Install dependencies**:

    ```bash
    pnpm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env.local` file in the root directory and populate it with the required values (see the table below).

4.  **Database Migration**:
    Push the schema to your Supabase database:

    ```bash
    pnpm run db:push
    ```

    Or run migrations if you have existing migration files:

    ```bash
    pnpm run db:migrate
    ```

5.  **Run the Development Server**:
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Required Environment Variables

| Variable                        | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                  | PostgreSQL connection string for Drizzle.                                  |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL.                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key.                                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key for admin tasks.                                 |
| `OPENROUTER_API_KEY`            | Your OpenRouter API key.                                                   |
| `OPENROUTER_PRIMARY_MODEL`      | Primary OpenRouter model ID (default: `mistralai/mistral-small-creative`). |
| `OPENROUTER_FALLBACK_MODEL`     | Fallback OpenRouter model ID used when primary is unavailable.             |
| `GOOGLE_OAUTH2_CLIENT_ID`       | Client ID for Google Authentication.                                       |
| `GOOGLE_OAUTH2_CLIENT_SECRET`   | Client Secret for Google Authentication.                                   |
| `NEXT_PUBLIC_APP_URL`           | The base URL of your application (e.g., `http://localhost:3000`).          |

## 🧪 Testing

Run unit tests with Jest:

```bash
pnpm test
```

Run E2E tests with Playwright:

```bash
npx playwright test
```
