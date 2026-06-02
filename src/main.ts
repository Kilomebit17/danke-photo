import './styles/main.scss';

import { preloadHero, initHero } from './modules/hero';
import { initServices } from './modules/services';
import { initRevealOnScroll } from './modules/motion';
import { initLazyImages } from './modules/lazy';

preloadHero();

function boot(): void {
  const year = document.querySelector<HTMLElement>('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  initHero();
  initServices();
  initLazyImages();
  initRevealOnScroll();

  const sections: Record<string, () => Promise<unknown>> = {
    gallery: () => import('./modules/gallery').then((m) => m.initGallery()),
  };

  const loaded = new Set<string>();

  const loadSection = (name: string): void => {
    if (loaded.has(name)) return;
    loaded.add(name);
    const loader = sections[name];
    if (!loader) return;
    loader()
      .then(() => {
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
