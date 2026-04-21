import { gsap, prefersReducedMotion } from './motion';
import heroPreview from '../assets/preview/preview.webp?url';

const heroSrc = heroPreview;

export function preloadHero(): void {
  if (!heroSrc) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroSrc;
  link.setAttribute('fetchpriority', 'high');
  link.type = 'image/webp';
  document.head.insertBefore(link, document.head.firstChild);
}

export function initHero(): void {
  const img = document.querySelector<HTMLImageElement>('[data-hero-image]');
  if (img && heroSrc) {
    img.src = heroSrc;
  }

  const loader = document.querySelector<HTMLElement>('[data-loader]');
  const loaderText = loader?.querySelector<HTMLElement>('.page-loader__text');
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  const words = title
    ? Array.from(title.querySelectorAll<HTMLElement>('.word'))
    : [];
  const heroReveals = document.querySelectorAll<HTMLElement>(
    '.hero [data-reveal]'
  );
  const scroll = document.querySelector<HTMLElement>('.hero__scroll');

  if (prefersReducedMotion) {
    loader?.classList.add('is-hidden');
    words.forEach((w) => (w.style.transform = 'translateY(0)'));
    heroReveals.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    if (img) img.style.transform = 'scale(1)';
    return;
  }

  gsap.set(words, { yPercent: 110, opacity: 0 });
  gsap.set(heroReveals, { y: 28, opacity: 0 });

  const tl = gsap.timeline({ delay: 0.05 });

  if (loaderText) {
    tl.to(loaderText, { opacity: 1, duration: 0.4, ease: 'power2.out' }).to(
      loaderText,
      { opacity: 0, duration: 0.4, delay: 0.25, ease: 'power2.out' }
    );
  }

  tl.add(() => loader?.classList.add('is-hidden'))
    .fromTo(
      img,
      { scale: 1.15, opacity: 0 },
      { scale: 1.02, opacity: 1, duration: 1.4, ease: 'power2.out' },
      '<'
    )
    .to(
      words,
      {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.08,
      },
      '-=0.9'
    )
    .to(
      heroReveals,
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
      },
      '-=0.65'
    );

  if (scroll) {
    tl.from(scroll, { opacity: 0, y: -10, duration: 0.5, ease: 'power2.out' }, '-=0.35');
  }
}
