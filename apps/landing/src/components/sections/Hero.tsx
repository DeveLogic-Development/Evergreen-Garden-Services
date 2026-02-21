import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import { Container } from '@/components/ui/Container';
import { heroSlides } from '@/data/content';
import { ensureGsapPlugins, gsap } from '@/lib/gsap';

type HeroProps = {
  reducedMotion: boolean;
};

export function Hero({ reducedMotion }: HeroProps): React.JSX.Element {
  const rootRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const copyRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  const shapeRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) {
      return;
    }

    ensureGsapPlugins();

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([titleRef.current, copyRef.current, ctaRef.current], { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        [titleRef.current, copyRef.current, ctaRef.current],
        { autoAlpha: 0, y: 32 },
        { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.12 },
      );

      shapeRefs.current.forEach((shape, index) => {
        gsap.to(shape, {
          yPercent: (index + 1) * -14,
          xPercent: (index + 1) * 5,
          ease: 'none',
          scrollTrigger: {
            trigger: rootElement,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, rootElement);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="home" ref={rootRef} className="relative flex min-h-[92vh] items-end overflow-hidden pb-16 pt-32 sm:items-center">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        autoplay={reducedMotion ? false : { delay: 4200, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="absolute inset-0 hero-swiper"
      >
        {heroSlides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="absolute inset-0">
              <img src={slide.image} alt={slide.subtitle} className="h-full w-full object-cover" loading="eager" fetchPriority="high" />
              <div className="absolute inset-0 bg-[linear-gradient(125deg,rgb(var(--color-brand-900-rgb)/0.82),rgb(var(--color-brand-700-rgb)/0.52),rgb(var(--color-brand-500-rgb)/0.24))]" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="hero-noise absolute inset-0" />

      <div
        ref={(node) => {
          if (node) {
            shapeRefs.current[0] = node;
          }
        }}
        className="absolute -left-10 top-24 h-40 w-40 rounded-full bg-accent-500/45 blur-3xl"
      />
      <div
        ref={(node) => {
          if (node) {
            shapeRefs.current[1] = node;
          }
        }}
        className="absolute right-6 top-20 h-52 w-52 rounded-full bg-brand-300/35 blur-3xl"
      />

      <Container className="relative z-10">
        <div className="max-w-2xl rounded-3xl border border-surface/50 bg-surface/16 p-6 text-text-invert backdrop-blur-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-500">Evergreen garden services</p>
          <h1 ref={titleRef} className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Modern garden care with a refined one-page experience.
          </h1>
          <p ref={copyRef} className="mt-4 max-w-xl text-sm leading-6 text-surface/90 sm:text-base">
            Explore service options, project highlights, and client feedback in one smooth, mobile-first experience.
          </p>
          <a
            ref={ctaRef}
            href="#services"
            className="tap-target mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-surface/75 bg-surface/15 px-5 text-sm font-semibold text-text-invert transition hover:bg-surface/24"
          >
            Explore services
          </a>
        </div>
      </Container>
    </section>
  );
}
