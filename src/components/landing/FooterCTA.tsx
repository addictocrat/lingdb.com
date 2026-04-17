import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export default function FooterCTA({ locale = "en" }: { locale?: string }) {
  const t = useTranslations("landing");

  return (
    <section className="px-4 py-20 md:py-22 sm:px-6">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-12 text-center text-white shadow-2xl shadow-primary-500/25 sm:p-16">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("footer_title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-xl text-white/80">
          {t("footer_description")}
        </p>
        <Link
          href={`/${locale}/signup`}
          className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-primary-600 shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.97]"
        >
          {t("footer_cta")}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
