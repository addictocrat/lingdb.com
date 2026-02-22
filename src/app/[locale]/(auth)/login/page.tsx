import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Log In',
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginForm locale={locale} />
    </main>
  );
}
