import { Container } from '@/components/ui/Container';
import { services } from '@/data/content';

export function Services(): React.JSX.Element {
  return (
    <section id="services" className="py-16 sm:py-20">
      <Container>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Services</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand-900 sm:text-4xl">Service options tailored to each type of garden</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              data-reveal
              className="group relative overflow-hidden rounded-2xl border border-surface/65 bg-surface/60 shadow-[0_14px_30px_rgb(var(--color-brand-900-rgb)/0.12)]"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(var(--color-brand-900-rgb)/0.72))] opacity-90" />
              </div>

              <div className="relative p-5">
                <h3 className="text-lg font-semibold text-brand-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-700">{service.copy}</p>
                <a href="#contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                  Learn more
                  <span className="h-0.5 w-8 bg-accent-500 transition-all duration-300 group-hover:w-12" />
                </a>
              </div>

              <div className="pointer-events-none absolute inset-0 border border-accent-500/0 transition duration-300 group-hover:border-accent-500/55" />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
