import { useMemo, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { projects, type ProjectCategory, type ProjectItem } from '@/data/content';

const filters: ProjectCategory[] = ['All', 'Landscaping', 'Maintenance', 'Plant Care'];

export function Projects(): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>('All');
  const [selected, setSelected] = useState<ProjectItem | null>(null);

  const visibleProjects = useMemo(() => {
    if (activeFilter === 'All') {
      return projects;
    }
    return projects.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  return (
    <>
      <section id="projects" className="relative py-16 sm:py-20">
        <div className="pointer-events-none absolute -right-10 top-16 h-44 w-44 rounded-full bg-accent-500/30 blur-3xl" />
        <Container>
          <div data-reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Projects</p>
              <h2 className="mt-2 text-3xl font-semibold text-brand-900 sm:text-4xl">Recent garden projects and transformation highlights</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={[
                    'tap-target inline-flex min-h-11 items-center rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.14em] transition',
                    activeFilter === filter
                      ? 'border-brand-700 bg-brand-700 text-text-invert'
                      : 'border-surface/70 bg-surface/66 text-brand-700',
                  ].join(' ')}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((item) => (
              <button
                key={item.id}
                type="button"
                data-reveal
                onClick={() => setSelected(item)}
                className="group relative overflow-hidden rounded-2xl border border-surface/65"
              >
                <img src={item.image} alt={item.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(var(--color-brand-900-rgb)/0.82))]" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-left text-text-invert">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-500">{item.category}</p>
                  <p className="mt-1 text-base font-semibold">{item.title}</p>
                </div>
                <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface/70 bg-surface/14 text-text-invert">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-900/76 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-surface/70 bg-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={selected.image} alt={selected.title} className="h-[52vh] w-full object-cover" loading="lazy" />
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{selected.category}</p>
                <p className="text-lg font-semibold text-brand-900">{selected.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="tap-target inline-flex min-h-11 items-center rounded-xl border border-brand-300 bg-surface px-3 text-sm font-semibold text-brand-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
