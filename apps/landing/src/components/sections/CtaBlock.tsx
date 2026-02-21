import { useEffect, useRef } from 'react';
import { Container } from '@/components/ui/Container';
import { ensureGsapPlugins, gsap } from '@/lib/gsap';

type CtaBlockProps = {
  reducedMotion: boolean;
};

export function CtaBlock({ reducedMotion }: CtaBlockProps): React.JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const patternRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    const patternElement = patternRef.current;

    if (!sectionElement || !patternElement || reducedMotion) {
      return;
    }

    ensureGsapPlugins();

    const tween = gsap.to(patternElement, {
      yPercent: -16,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-surface/65 bg-brand-900 p-6 text-text-invert sm:p-8">
          <div ref={patternRef} className="cta-pattern absolute inset-0" />
          <div className="relative z-10 max-w-3xl" data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">Ready to continue?</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Move from inspiration to execution with the contact form below.</h2>
            <p className="mt-3 text-sm leading-6 text-surface/90 sm:text-base">
              Share your vision and we will map the right service plan to keep your garden healthy, clean, and visually strong.
            </p>
            <a
              href="#contact"
              className="tap-target mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-surface/75 bg-surface/12 px-5 text-sm font-semibold text-text-invert transition hover:bg-surface/22"
            >
              Go to contact form
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
