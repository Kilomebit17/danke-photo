import { services } from '../data/content';
import { photos } from '../data/assets';
import type { CategoryKey } from '../data/assets';
import { prefersReducedMotion } from './motion';

const SLIDES_PER_CARD = 4;

function previewImages(id: CategoryKey): string[] {
  const pool =
    id === 'loveStory'
      ? photos.loveStory.length
        ? photos.loveStory
        : photos.family
      : photos[id];
  // Pick evenly-spaced photos so the slider feels curated, not sequential.
  if (pool.length <= SLIDES_PER_CARD) return pool.slice();
  const step = Math.floor(pool.length / SLIDES_PER_CARD);
  return Array.from({ length: SLIDES_PER_CARD }, (_, i) => pool[i * step]);
}

export function initServices(): void {
  const grid = document.querySelector<HTMLElement>('[data-services-grid]');
  if (!grid) return;

  const markup = services
    .map((s) => {
      const imgs = previewImages(s.id);
      const slides = imgs
        .map((url, i) => {
          const altLabel = `${s.title} ${s.titleEm}`.trim();
          return `<img
              class="service-card__slide${i === 0 ? ' is-active' : ''}"
              data-src="${url}"
              alt="${altLabel} — кадр ${i + 1}, Dana Serdiuk"
              loading="lazy"
              decoding="async"
              width="800"
              height="600"
            />`;
        })
        .join('');

      const items = s.items.map((i) => `<li>${i}</li>`).join('');
      const title = s.titleEm
        ? `${s.title} <em>${s.titleEm}</em>`
        : `<em>${s.title}</em>`;
      return `
        <article class="service-card" data-reveal="fade" data-tile>
          <div class="service-card__media" data-card-slider>
            ${slides}
            <span class="service-card__dots" aria-hidden="true">
              ${imgs.map((_, i) => `<i class="${i === 0 ? 'is-active' : ''}"></i>`).join('')}
            </span>
          </div>
          <span class="service-card__index">${s.index} — ${s.id === 'wedding' ? 'Morning' : s.id}</span>
          <h3 class="service-card__title">${title}</h3>
          <ul class="service-card__list">${items}</ul>
          <div class="service-card__footer">
            <div class="service-card__price">
              <strong>${s.price}</strong>
              <span>${s.priceNote}</span>
            </div>
            <a href="#booking" class="service-card__cta" data-prefill="${s.id}">
              Забронювати
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" focusable="false">
                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </div>
        </article>
      `;
    })
    .join('');

  grid.innerHTML = markup;

  initCardSliders(grid);

  // Prefill booking <select> when a "Забронювати" link is tapped.
  grid.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      '[data-prefill]'
    );
    if (!a) return;
    const id = a.dataset.prefill ?? '';
    const select = document.querySelector<HTMLSelectElement>('#f-type');
    if (!select) return;

    const map: Record<string, string> = {
      loveStory: 'family',
      family: 'family',
      personal: 'personal',
      wedding: 'morning',
    };
    const val = map[id];
    if (val) {
      select.value = val;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

/**
 * Card image slider — crossfade + Ken-Burns zoom.
 * Runs only when the card is actually in view (IntersectionObserver) and each
 * card has its own phase offset so the three cards never cycle in lockstep.
 */
function initCardSliders(root: ParentNode): void {
  if (prefersReducedMotion) return;

  const sliders = Array.from(
    root.querySelectorAll<HTMLElement>('[data-card-slider]')
  );

  sliders.forEach((el, cardIndex) => {
    const slides = Array.from(
      el.querySelectorAll<HTMLImageElement>('.service-card__slide')
    );
    const dots = Array.from(
      el.querySelectorAll<HTMLElement>('.service-card__dots i')
    );
    if (slides.length <= 1) return;

    let current = 0;
    let timer: number | null = null;
    // Stagger start times per card so they don't fire simultaneously.
    const interval = 4200;
    const startDelay = cardIndex * 1100;

    const goTo = (index: number) => {
      slides[current].classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current]?.classList.add('is-active');
    };

    const tick = () => goTo(current + 1);

    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(tick, interval);
    };

    const stop = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    };

    // Restart auto-play after a manual swipe.
    const restartTimer = () => {
      stop();
      timer = window.setInterval(tick, interval);
    };

    // —— Swipe / drag support ——
    // pan-y: browser handles vertical scroll; we own horizontal swipes.
    el.style.touchAction = 'pan-y';

    let dragStartX = 0;
    let isDragging = false;
    const SWIPE_THRESHOLD = 40;

    el.addEventListener('pointerdown', (e) => {
      dragStartX = e.clientX;
      isDragging = true;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      if (Math.abs(e.clientX - dragStartX) > 8) e.preventDefault();
    }, { passive: false });

    el.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      goTo(delta < 0 ? current + 1 : current - 1);
      restartTimer();
    });

    el.addEventListener('pointercancel', () => { isDragging = false; });

    // Prevent accidental image drag-out on desktop.
    el.addEventListener('dragstart', (e) => e.preventDefault());

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // First run gets a per-card phase offset.
          window.setTimeout(start, startDelay);
        } else {
          stop();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);

    // Pause the slider whenever the tab is hidden — avoids running intervals
    // for tabs the user isn't looking at.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (el.getBoundingClientRect().top < window.innerHeight) start();
    });
  });
}
