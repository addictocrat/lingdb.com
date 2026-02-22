import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password',
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <ResetPasswordForm locale={locale} />
    </main>
  );
}
