export type HeroSlide = {
  id: string;
  heading: string;
  subtitle: string;
  copy: string;
  image: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  copy: string;
  image: string;
};

export type ProjectCategory = 'All' | 'Landscaping' | 'Maintenance' | 'Plant Care';

export type ProjectItem = {
  id: string;
  title: string;
  category: Exclude<ProjectCategory, 'All'>;
  image: string;
};

export type TestimonialItem = {
  id: string;
  quote: string;
  role: string;
  image: string;
};

export const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Projects' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
] as const;

export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-a',
    heading: 'Transform outdoor spaces into calm living gardens',
    subtitle: 'Design-led Garden Care',
    copy: 'A polished one-page experience designed for homeowners and small businesses who value consistent garden care.',
    image: '/template/carousel-1.jpg',
  },
  {
    id: 'slide-b',
    heading: 'Landscaping, maintenance, and plant care in one flow',
    subtitle: 'Craft + Reliability',
    copy: 'Clean service planning with clear updates and beautifully maintained results.',
    image: '/template/carousel-2.jpg',
  },
];

export const featurePills = [
  {
    id: 'craft',
    title: 'Craft Quality',
    copy: 'Detail-first planning and finishing across every service visit.',
  },
  {
    id: 'clarity',
    title: 'Clear Workflow',
    copy: 'A straightforward path from request to completion and follow-up.',
  },
  {
    id: 'care',
    title: 'Seasonal Care',
    copy: 'Services tuned to the changing needs of each garden space.',
  },
];

export const services: ServiceItem[] = [
  {
    id: 'landscaping',
    title: 'Landscaping',
    copy: 'Layout refinement and structure updates for a polished outdoor look.',
    image: '/template/service-1.jpg',
  },
  {
    id: 'pruning',
    title: 'Pruning & shaping',
    copy: 'Focused plant shaping to keep growth healthy and visually balanced.',
    image: '/template/service-2.jpg',
  },
  {
    id: 'irrigation',
    title: 'Irrigation support',
    copy: 'Water flow checks and practical adjustments for better garden health.',
    image: '/template/service-3.jpg',
  },
  {
    id: 'maintenance',
    title: 'Garden maintenance',
    copy: 'Routine upkeep designed around your property and garden rhythm.',
    image: '/template/service-4.jpg',
  },
  {
    id: 'green-tech',
    title: 'Sustainable methods',
    copy: 'Practical green approaches that help gardens thrive with less waste.',
    image: '/template/service-5.jpg',
  },
  {
    id: 'urban',
    title: 'Urban garden care',
    copy: 'Smart solutions for compact homes, courtyards, and business fronts.',
    image: '/template/service-6.jpg',
  },
];

export const projects: ProjectItem[] = [
  { id: 'p-a', title: 'Courtyard refresh', category: 'Landscaping', image: '/template/service-1.jpg' },
  { id: 'p-b', title: 'Plant bed tune-up', category: 'Plant Care', image: '/template/service-2.jpg' },
  { id: 'p-c', title: 'Irrigation cleanup', category: 'Maintenance', image: '/template/service-3.jpg' },
  { id: 'p-d', title: 'Front garden reset', category: 'Landscaping', image: '/template/service-4.jpg' },
  { id: 'p-e', title: 'Canopy shaping', category: 'Plant Care', image: '/template/service-5.jpg' },
  { id: 'p-f', title: 'Seasonal tidy', category: 'Maintenance', image: '/template/service-6.jpg' },
];

export const testimonials: TestimonialItem[] = [
  {
    id: 't-a',
    quote: 'The whole process feels clean and premium. We always know what is happening in the garden plan.',
    role: 'Client feedback placeholder',
    image: '/template/testimonial-1.jpg',
  },
  {
    id: 't-b',
    quote: 'Beautiful execution and clear communication. The garden now feels intentional and effortless to maintain.',
    role: 'Client feedback placeholder',
    image: '/template/testimonial-2.jpg',
  },
  {
    id: 't-c',
    quote: 'Our outdoor space changed completely. The team kept everything structured and calm throughout.',
    role: 'Client feedback placeholder',
    image: '/template/testimonial-1.jpg',
  },
];
