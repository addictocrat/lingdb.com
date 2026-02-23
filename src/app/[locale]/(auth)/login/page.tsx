import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Log In',
};

export default async function LoginPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { locale } = params;
  const errorParam = searchParams?.error;
  const error = typeof errorParam === 'string' ? errorParam : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginForm locale={locale} initialError={error} />
    </main>
  );
}
