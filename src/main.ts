import './styles/main.scss';

import { preloadHero, initHero } from './modules/hero';
import { initHeader } from './modules/header';
import { initServices } from './modules/services';
import { initRevealOnScroll } from './modules/motion';
import { initLazyImages } from './modules/lazy';

/**
 * Only these three concerns ship in the initial JS bundle:
 *   - hero intro (LCP)
 *   - header interactions
 *   - services render (above-the-fold on tall mobile viewports)
 *
 * Gallery (+ Swiper), booking form logic, and the FAQ accordion are
 * dynamically imported the first time their section scrolls near the
 * viewport. On a fresh landing this keeps initial JS small and TTI quick.
 */

// Preload the hero WebP as the very first thing we do — earlier than any
// module init so the browser can start the fetch in parallel with JS parsing.
preloadHero();

function boot(): void {
  const year = document.querySelector<HTMLElement>('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  initHeader();
  initHero();
  initServices();
  initLazyImages();
  initRevealOnScroll();

  // —— Lazy section loaders ——
  // Use a single IntersectionObserver; unobserve on first hit.
  const sections: Record<string, () => Promise<unknown>> = {
    gallery: () => import('./modules/gallery').then((m) => m.initGallery()),
    booking: () => import('./modules/booking').then((m) => m.initBooking()),
    faq: () => import('./modules/faq').then((m) => m.initFaq()),
  };

  const loaded = new Set<string>();

  const loadSection = (name: string): void => {
    if (loaded.has(name)) return;
    loaded.add(name);
    const loader = sections[name];
    if (!loader) return;
    loader()
      .then(() => {
        // Re-scan for new reveal / lazy-load targets the chunk just rendered.
        initLazyImages();
        initRevealOnScroll();
      })
      .catch(() => loaded.delete(name));
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const name = (entry.target as HTMLElement).dataset.section;
          if (!name) return;
          loadSection(name);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '300px 0px' }
    );

    Object.keys(sections).forEach((name) => {
      const el = document.querySelector<HTMLElement>(`[data-section="${name}"]`);
      if (el) io.observe(el);
    });
  } else {
    // Fallback — just load everything on idle.
    const rIC =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
        .requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
    rIC(() => Object.keys(sections).forEach(loadSection));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
