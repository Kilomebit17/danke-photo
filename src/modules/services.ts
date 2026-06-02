import { services } from '../data/content';
import { serviceCardImages } from '../data/assets';
import type { CategoryKey } from '../data/assets';

function cardImage(id: CategoryKey): string {
  return serviceCardImages[id] || '';
}

export function initServices(): void {
  const grid = document.querySelector<HTMLElement>('[data-services-grid]');
  if (!grid) return;

  const markup = services
    .map((s) => {
      const img = cardImage(s.id);

      const items = s.items.map((i) => `<li>-${i}</li>`).join('');

      return `
        <article class="service-card" data-reveal="fade" data-tile>
          <div class="service-card__media">
            <img
              class="service-card__img"
              src="${img}"
              alt="${s.title}"
              loading="lazy"
              decoding="async"
              width="390"
              height="100"
            />
          </div>
          <div class="service-card__body">
            <h3 class="service-card__title">${s.title}</h3>
            <ul class="service-card__list">${items}</ul>
            <div class="service-card__price">${s.price}</div>
          </div>
        </article>
      `;
    })
    .join('');

  grid.innerHTML = markup;
}
