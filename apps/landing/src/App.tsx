import { useEffect, useState } from 'react';
import { Header } from '@/components/sections/Header';
import { Hero } from '@/components/sections/Hero';
import { FeatureStrip } from '@/components/sections/FeatureStrip';
import { About } from '@/components/sections/About';
import { Services } from '@/components/sections/Services';
import { Projects } from '@/components/sections/Projects';
import { Testimonials } from '@/components/sections/Testimonials';
import { CtaBlock } from '@/components/sections/CtaBlock';
import { ContactFooter } from '@/components/sections/ContactFooter';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { ensureGsapPlugins, gsap } from '@/lib/gsap';

function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const sectionIds = ['home', 'about', 'services', 'projects', 'testimonials', 'contact'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.36, rootMargin: '-20% 0px -35% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return activeSection;
}

export function App(): React.JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const activeSection = useActiveSection();

  useEffect(() => {
    ensureGsapPlugins();

    const elements = gsap.utils.toArray<HTMLElement>('[data-reveal]');

    if (reducedMotion) {
      gsap.set(elements, { autoAlpha: 1, y: 0 });
      return;
    }

    const animations = elements.map((element) =>
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.82,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 84%',
            once: true,
          },
        },
      ),
    );

    return () => {
      animations.forEach((animation) => {
        animation.scrollTrigger?.kill();
        animation.kill();
      });
    };
  }, [reducedMotion]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-text">
      <Header activeSection={activeSection} />
      <main>
        <Hero reducedMotion={reducedMotion} />
        <FeatureStrip />
        <About reducedMotion={reducedMotion} />
        <Services />
        <Projects />
        <Testimonials reducedMotion={reducedMotion} />
        <CtaBlock reducedMotion={reducedMotion} />
        <ContactFooter />
      </main>
    </div>
  );
}
