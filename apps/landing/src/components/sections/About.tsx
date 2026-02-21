import { useEffect, useRef } from 'react';
import { Container } from '@/components/ui/Container';
import { ensureGsapPlugins, gsap } from '@/lib/gsap';

type AboutProps = {
  reducedMotion: boolean;
};

const highlights = [
  'Tailored garden plans for each property',
  'Consistent quality with dependable scheduling',
  'Design-aware maintenance for long-term beauty',
];

export function About({ reducedMotion }: AboutProps): React.JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rootElement = sectionRef.current;
    const badgeElement = badgeRef.current;

    if (!rootElement || !badgeElement || reducedMotion) {
      return;
    }

    ensureGsapPlugins();

    const tween = gsap.to(badgeElement, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: rootElement,
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
    <section id="about" ref={sectionRef} className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div data-reveal className="relative">
            <img src="/template/about.jpg" alt="Garden detail" className="h-[360px] w-full rounded-3xl object-cover sm:h-[430px]" loading="lazy" />
            <div
              ref={badgeRef}
              className="absolute -bottom-5 left-5 max-w-[240px] rounded-2xl border border-surface/70 bg-surface/74 p-4 shadow-[0_12px_26px_rgb(var(--color-brand-900-rgb)/0.14)] backdrop-blur-md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Evergreen standard</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-brand-900">Thoughtful outdoor spaces maintained with care and consistency.</p>
            </div>
          </div>

          <div data-reveal className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">About</p>
            <h2 className="text-3xl font-semibold leading-tight text-brand-900 sm:text-4xl">Garden care that balances aesthetics with practical service planning.</h2>
            <p className="text-sm leading-6 text-brand-800 sm:text-base">
              We focus on reliable scheduling, thoughtful execution, and clear communication so every outdoor space keeps improving
              over time.
            </p>

            <div className="grid gap-2">
              {highlights.map((item) => (
                <div key={item} className="inline-flex items-start gap-2 rounded-xl border border-surface/65 bg-surface/62 px-3 py-2">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
                  <p className="text-sm text-brand-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
