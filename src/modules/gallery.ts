import { galleryPool, categoryLabel } from '../data/assets';
import { initLazyImages } from './lazy';
import type Swiper from 'swiper';

let swiperInstance: Swiper | null = null;
let lastFocused: HTMLElement | null = null;

export async function initGallery(): Promise<void> {
  const grid = document.querySelector<HTMLElement>('[data-gallery-grid]');
  const modalEl = document.querySelector<HTMLElement>('[data-gallery-modal]');
  const slidesWrap = document.querySelector<HTMLElement>(
    '[data-gallery-slides]'
  );
  const closeBtn = document.querySelector<HTMLButtonElement>(
    '[data-gallery-close]'
  );
  const counter = document.querySelector<HTMLElement>('[data-gallery-counter]');
  const prevBtn = document.querySelector<HTMLButtonElement>(
    '.gallery-swiper__prev'
  );
  const nextBtn = document.querySelector<HTMLButtonElement>(
    '.gallery-swiper__next'
  );

  if (!grid || !modalEl || !slidesWrap) return;
  const modal = modalEl;

  // —— Tile markup helper ——
  const tileMarkup = (p: (typeof galleryPool)[number], i: number) => {
    const n = i + 1;
    return `<button class="gallery-tile" data-tile data-gallery-index="${i}" type="button" aria-label="Відкрити фото ${n}: ${categoryLabel[p.category]}">
        <img
          data-src="${p.url}"
          alt="${categoryLabel[p.category]} — фото ${n}, Dana Serdiuk"
          loading="lazy"
          decoding="async"
          width="600"
          height="800"
        />
        <div class="gallery-tile__overlay" aria-hidden="true">
          <span class="gallery-tile__category">${categoryLabel[p.category]}</span>
          <span class="gallery-tile__zoom">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M5 5h5M5 5v5M19 5h-5M19 5v5M5 19h5M5 19v-5M19 19h-5M19 19v-5" stroke-linecap="round"/></svg>
          </span>
        </div>
      </button>`;
  };

  // —— "Show more" button (mobile only) ——
  const moreBtn = document.createElement('div');
  moreBtn.className = 'gallery__more';
  moreBtn.innerHTML = `<button class="btn btn--ghost gallery__more-btn" type="button">
    <span>Показати більше</span>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`;
  grid.insertAdjacentElement('afterend', moreBtn);

  const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

  const PAGE_SIZE = 10;
  let rendered = 0;

  const renderBatch = (count: number) => {
    const batch = galleryPool.slice(rendered, rendered + count);
    grid.insertAdjacentHTML('beforeend', batch.map((p, j) => tileMarkup(p, rendered + j)).join(''));
    rendered += batch.length;
    moreBtn.style.display = rendered >= galleryPool.length ? 'none' : '';
    initLazyImages();
  };

  moreBtn.addEventListener('click', () => renderBatch(PAGE_SIZE));

  if (isDesktop()) {
    renderBatch(galleryPool.length);
  } else {
    renderBatch(PAGE_SIZE);
  }

  // —— Slides: empty <img> placeholders; we inject the real src only when the
  //     modal opens (avoids ~40 non-critical image fetches on idle).
  slidesWrap.innerHTML = galleryPool
    .map(
      (p, i) => `
      <div class="swiper-slide" data-slide-index="${i}">
        <img
          alt="${categoryLabel[p.category]} — фото ${i + 1}, Dana Serdiuk"
          width="1600"
          height="1200"
          decoding="async"
          loading="lazy"
          data-src="${p.url}"
        />
      </div>
    `
    )
    .join('');

  // —— Click → open modal
  grid.addEventListener('click', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-gallery-index]'
    );
    if (!tile) return;
    const idx = Number(tile.dataset.galleryIndex);
    openModal(idx);
  });

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
  });

  function loadSlideImage(index: number): void {
    const slide = slidesWrap!.querySelector<HTMLElement>(
      `[data-slide-index="${index}"] img[data-src]`
    );
    if (!slide) return;
    const img = slide as HTMLImageElement;
    img.src = img.dataset.src || '';
    img.removeAttribute('data-src');
  }

  function primeNeighbouringSlides(center: number): void {
    // Preload the current + adjacent slides only.
    [center - 1, center, center + 1].forEach((i) => {
      if (i >= 0 && i < galleryPool.length) loadSlideImage(i);
    });
  }

  function updateCounter(): void {
    if (!swiperInstance || !counter) return;
    const total = swiperInstance.slides.length;
    counter.textContent = `${swiperInstance.realIndex + 1} / ${total}`;
  }

  function updateNav(): void {
    if (!swiperInstance) return;
    prevBtn?.classList.toggle('is-disabled', swiperInstance.isBeginning);
    nextBtn?.classList.toggle('is-disabled', swiperInstance.isEnd);
  }

  async function openModal(startIndex: number): Promise<void> {
    lastFocused = document.activeElement as HTMLElement | null;

    // Code-split: only load Swiper when the user actually opens the modal.
    if (!swiperInstance) {
      const [{ default: SwiperCtor }, { Keyboard, Navigation }] =
        await Promise.all([
          import('swiper'),
          import('swiper/modules'),
          import('swiper/css'),
        ]);

      swiperInstance = new SwiperCtor('.gallery-swiper', {
        modules: [Keyboard, Navigation],
        initialSlide: startIndex,
        slidesPerView: 1,
        spaceBetween: 20,
        speed: 500,
        // Touch-swipe config — Swiper turns this on by default, but we make it
        // explicit so mobile swipe intent can't be accidentally disabled.
        allowTouchMove: true,
        touchStartPreventDefault: false,
        threshold: 6,
        grabCursor: true,
        keyboard: { enabled: true, onlyInViewport: false },
        navigation: {
          prevEl: '.gallery-swiper__prev',
          nextEl: '.gallery-swiper__next',
        },
      });

      swiperInstance.on('slideChange', () => {
        updateCounter();
        updateNav();
        if (swiperInstance) primeNeighbouringSlides(swiperInstance.realIndex);
      });
    } else {
      swiperInstance.slideTo(startIndex, 0);
    }

    primeNeighbouringSlides(startIndex);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    updateCounter();
    updateNav();

    // Move focus inside the dialog.
    closeBtn?.focus({ preventScroll: true });
  }

  function closeModal(): void {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus({ preventScroll: true });
  }
}
