import { faqItems } from '../data/content';

/**
 * Accordion — uses a CSS `grid-template-rows: 0fr → 1fr` transition so the
 * height animation is driven by the compositor (no JS tweening, no reflow work
 * beyond the toggle itself).
 */
export function initFaq(): void {
  const list = document.querySelector<HTMLElement>('[data-faq]');
  if (!list) return;

  list.innerHTML = faqItems
    .map(
      (item, i) => `
      <div class="faq-item" data-faq-item>
        <button class="faq-item__head" type="button" aria-expanded="false" aria-controls="faq-body-${i}">
          <span>${item.q}</span>
          <span class="faq-item__icon" aria-hidden="true"></span>
        </button>
        <div class="faq-item__body" id="faq-body-${i}" role="region" hidden>
          <div class="faq-item__body-inner">${item.a}</div>
        </div>
      </div>
    `
    )
    .join('');

  const items = Array.from(
    list.querySelectorAll<HTMLElement>('[data-faq-item]')
  );

  const closeItem = (el: HTMLElement): void => {
    const head = el.querySelector<HTMLButtonElement>('.faq-item__head');
    const body = el.querySelector<HTMLElement>('.faq-item__body');
    el.classList.remove('is-open');
    head?.setAttribute('aria-expanded', 'false');
    if (body) {
      // Delay `hidden` until the transition visually finishes.
      const onEnd = () => {
        if (!el.classList.contains('is-open')) body.hidden = true;
        body.removeEventListener('transitionend', onEnd);
      };
      body.addEventListener('transitionend', onEnd);
    }
  };

  const openItem = (el: HTMLElement): void => {
    const head = el.querySelector<HTMLButtonElement>('.faq-item__head');
    const body = el.querySelector<HTMLElement>('.faq-item__body');
    if (body) body.hidden = false;
    // Force style flush so the transition actually runs.
    void el.offsetHeight;
    el.classList.add('is-open');
    head?.setAttribute('aria-expanded', 'true');
  };

  list.addEventListener('click', (e) => {
    const head = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '.faq-item__head'
    );
    if (!head) return;
    const item = head.closest<HTMLElement>('[data-faq-item]');
    if (!item) return;

    const isOpen = item.classList.contains('is-open');
    items.forEach((other) => {
      if (other !== item && other.classList.contains('is-open')) closeItem(other);
    });
    if (isOpen) closeItem(item);
    else openItem(item);
  });
}
