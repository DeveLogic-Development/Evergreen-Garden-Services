import { BrandLogo } from '@/components/BrandLogo';
import { Container } from '@/components/ui/Container';
import { navItems } from '@/data/content';

export function ContactFooter(): React.JSX.Element {
  return (
    <section id="contact" className="pb-24 pb-safe-bottom pt-16 sm:pb-16 sm:pt-20">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article data-reveal className="rounded-3xl border border-surface/70 bg-surface/72 p-6 shadow-[0_14px_32px_rgb(var(--color-brand-900-rgb)/0.12)] backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Contact</p>
            <h2 className="mt-2 text-3xl font-semibold text-brand-900">Tell us about your garden space</h2>
            <p className="mt-2 text-sm leading-6 text-brand-800">Share your request and we will shape the right service path around your goals.</p>

            <form className="mt-5 grid gap-3" onSubmit={(event) => event.preventDefault()}>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Name
                <input
                  type="text"
                  placeholder="Your name"
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Area
                <input
                  type="text"
                  placeholder="Garden area"
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Service
                <input
                  type="text"
                  placeholder="Service needed"
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Message
                <textarea
                  rows={4}
                  placeholder="Tell us about your request"
                  className="rounded-xl border border-surface/75 bg-surface px-3 py-2 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                />
              </label>
              <button
                type="submit"
                className="tap-target mt-1 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-700 bg-brand-700 px-4 text-sm font-semibold text-text-invert transition hover:bg-brand-600"
              >
                Send request
              </button>
            </form>
          </article>

          <article data-reveal className="rounded-3xl border border-surface/70 bg-surface/72 p-6 shadow-[0_14px_32px_rgb(var(--color-brand-900-rgb)/0.12)] backdrop-blur-md">
            <BrandLogo size="lg" />
            <p className="mt-4 text-sm leading-6 text-brand-800">
              Evergreen delivers a calm, modern service experience focused on beautiful outcomes and dependable long-term care.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Page links</p>
                <ul className="mt-2 grid gap-2">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-sm text-brand-800 transition hover:text-brand-600">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Social placeholders</p>
                <div className="mt-2 flex items-center gap-2">
                  {['IG', 'FB', 'LN'].map((item) => (
                    <span
                      key={item}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface/75 bg-surface text-xs font-semibold text-brand-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-brand-700">Evergreen Garden Services. All rights reserved.</p>
          </article>
        </div>
      </Container>
    </section>
  );
}
