import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] font-inter">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-[var(--fg)] prose-p:text-[var(--fg)]/80 prose-li:text-[var(--fg)]/80 prose-strong:text-[var(--fg)]">
          {children}
        </div>
      </div>
    </div>
  );
}
