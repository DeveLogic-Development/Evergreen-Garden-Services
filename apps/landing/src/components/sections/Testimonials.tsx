import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Container } from '@/components/ui/Container';
import { testimonials } from '@/data/content';

type TestimonialsProps = {
  reducedMotion: boolean;
};

export function Testimonials({ reducedMotion }: TestimonialsProps): React.JSX.Element {
  return (
    <section id="testimonials" className="py-16 sm:py-20">
      <Container>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Testimonials</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand-900 sm:text-4xl">Client words, presented in a modern slider</h2>
        </div>

        <div className="mt-8" data-reveal>
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={reducedMotion ? false : { delay: 4300, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            spaceBetween={14}
            slidesPerView={1.06}
            breakpoints={{
              640: { slidesPerView: 1.4 },
              1024: { slidesPerView: 2.2 },
            }}
            className="testimonial-swiper"
          >
            {testimonials.map((item) => (
              <SwiperSlide key={item.id}>
                <article className="h-full rounded-2xl border border-surface/65 bg-surface/64 p-5 shadow-[0_12px_28px_rgb(var(--color-brand-900-rgb)/0.1)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt="Client portrait placeholder"
                      className="h-12 w-12 rounded-full object-cover"
                      loading="lazy"
                      sizes="48px"
                    />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{item.role}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-brand-800">“{item.quote}”</p>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Container>
    </section>
  );
}
