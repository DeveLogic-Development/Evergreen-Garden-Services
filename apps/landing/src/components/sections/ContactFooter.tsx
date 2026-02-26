import { useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Container } from '@/components/ui/Container';
import { navItems } from '@/data/content';

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function ContactFooter(): React.JSX.Element {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ name: '', phone: '', email: '', area: '', service: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitState(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error ?? 'Could not send your request. Please try again.');
      }

      setForm({ name: '', phone: '', email: '', area: '', service: '', message: '' });
      setSubmitState({ type: 'success', message: 'Request sent. We will follow up soon.' });
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not send your request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="pb-24 pb-safe-bottom pt-16 sm:pb-16 sm:pt-20">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article data-reveal className="rounded-3xl border border-surface/70 bg-surface/72 p-6 shadow-[0_14px_32px_rgb(var(--color-brand-900-rgb)/0.12)] backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Contact</p>
            <h2 className="mt-2 text-3xl font-semibold text-brand-900">Tell us about your garden space</h2>
            <p className="mt-2 text-sm leading-6 text-brand-800">Share your request and we will shape the right service path around your goals.</p>

            <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Name
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                  required
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Phone number
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="Your phone number"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: sanitizePhone(event.target.value) }))
                  }
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                  required
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Email (optional)
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Area
                <input
                  type="text"
                  placeholder="Garden area"
                  value={form.area}
                  onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))}
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                  required
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Service
                <input
                  type="text"
                  placeholder="Service needed"
                  value={form.service}
                  onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}
                  className="tap-target min-h-11 rounded-xl border border-surface/75 bg-surface px-3 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                  required
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Message
                <textarea
                  rows={4}
                  placeholder="Tell us about your request"
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  className="rounded-xl border border-surface/75 bg-surface px-3 py-2 text-base text-brand-900 outline-none transition focus:border-brand-500 sm:text-sm"
                  required
                />
              </label>
              {submitState ? (
                <p
                  className={[
                    'rounded-xl border px-3 py-2 text-sm',
                    submitState.type === 'success'
                      ? 'border-brand-300 bg-brand-300/10 text-brand-800'
                      : 'border-accent-600 bg-accent-500/40 text-brand-900',
                  ].join(' ')}
                >
                  {submitState.message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="tap-target mt-1 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-700 bg-brand-700 px-4 text-sm font-semibold text-text-invert transition hover:bg-brand-600"
              >
                {submitting ? 'Sending...' : 'Send request'}
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
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Social Platform</p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href="https://www.facebook.com/profile.php?id=61587175082102"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface/75 bg-surface text-xs font-semibold text-brand-700 transition hover:text-brand-600"
                  >
                    FB
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-1 text-xs text-brand-700">
              <p>© {currentYear} Evergreen Garden Services. All rights reserved.</p>
              <p>
                Designed and developed by{' '}
                <a
                  href="https://develogic-digital.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-600"
                >
                  DeveLogic Digital
                </a>
              </p>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
