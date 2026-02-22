import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up',
};

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <SignupForm locale={locale} />
    </main>
  );
}
