import { Container } from '@/components/ui/Container';
import { featurePills } from '@/data/content';

export function FeatureStrip(): React.JSX.Element {
  return (
    <section className="relative -mt-8 pb-10 sm:-mt-12">
      <Container>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featurePills.map((feature, index) => (
            <article
              key={feature.id}
              data-reveal
              className="group rounded-2xl border border-surface/70 bg-surface/72 p-4 shadow-[0_14px_30px_rgb(var(--color-brand-900-rgb)/0.1)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgb(var(--color-brand-900-rgb)/0.18)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700/12 text-brand-700">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {index === 0 ? (
                    <>
                      <path d="M4 20h16" />
                      <path d="M7 20V10" />
                      <path d="M17 20V10" />
                      <path d="M12 4v6" />
                    </>
                  ) : index === 1 ? (
                    <>
                      <path d="M3 12h18" />
                      <path d="M12 3v18" />
                      <path d="M6 6h12v12H6z" />
                    </>
                  ) : (
                    <>
                      <path d="M12 3a9 9 0 1 0 9 9" />
                      <path d="M12 8v4l3 3" />
                    </>
                  )}
                </svg>
              </span>
              <h3 className="mt-3 text-base font-semibold text-brand-900">{feature.title}</h3>
              <p className="mt-1 text-sm leading-6 text-brand-700">{feature.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
