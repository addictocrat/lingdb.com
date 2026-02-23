'use client';

import { useEffect, useRef } from 'react';
import { UserPlus, BookPlus, GraduationCap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { useTranslations } from 'next-intl';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    titleKey: 'step1',
    descKey: 'step1_desc',
    color: 'from-primary-500 to-primary-600',
  },
  {
    number: '02',
    icon: BookPlus,
    titleKey: 'step2',
    descKey: 'step2_desc',
    color: 'from-green-500 to-green-600',
  },
  {
    number: '03',
    icon: GraduationCap,
    titleKey: 'step3',
    descKey: 'step3_desc',
    color: 'from-accent-500 to-accent-600',
  },
];

export default function HowItWorks() {
  const t = useTranslations('landing');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.step-card', {
        y: 50,
        opacity: 0,
      });

      gsap.to('.step-card', {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--surface)] px-4 py-20 sm:px-6 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t('how_it_works')}
          </h2>

        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="step-card relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg)] p-8 text-center transition-all duration-300 hover:shadow-lg"
            >
              {/* Number badge */}
              <div
                className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-2xl font-bold text-white shadow-lg`}
              >
                <step.icon className="h-7 w-7" />
              </div>

              <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-[var(--fg)]/30">
                Step {step.number}
              </span>
              <h3 className="mb-3 text-2xl font-bold">{t(step.titleKey)}</h3>
              <p className="text-lg leading-relaxed text-[var(--fg)]/60">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
