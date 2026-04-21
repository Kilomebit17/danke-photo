/**
 * Lightweight IntersectionObserver-based lazy loader.
 * Images carry their real source in `data-src`; once loaded we add
 * `.is-loaded` to the tile so SCSS can fade it in.
 */
export function initLazyImages(root: ParentNode = document): void {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-src]'));
  if (imgs.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    imgs.forEach(swap);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        swap(entry.target as HTMLImageElement);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '200px 0px', threshold: 0.01 }
  );

  imgs.forEach((img) => io.observe(img));
}

function swap(img: HTMLImageElement): void {
  const src = img.dataset.src;
  if (!src) return;
  img.src = src;
  img.removeAttribute('data-src');
  const done = () => img.closest('[data-tile]')?.classList.add('is-loaded');
  if (img.complete) done();
  else img.addEventListener('load', done, { once: true });
}
