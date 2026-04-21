export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const burger = document.querySelector<HTMLButtonElement>('[data-burger]');
  if (!header) return;

  let mobileNav: HTMLElement | null = null;

  const buildMobileNav = (): HTMLElement => {
    if (mobileNav) return mobileNav;
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.setAttribute('aria-label', 'Мобільна навігація');
    nav.innerHTML = `
      <a href="#services">Послуги</a>
      <a href="#gallery">Галерея</a>
      <a href="#booking">Записатись</a>
      <a href="#faq">FAQ</a>
    `;
    nav.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'A') closeMobile();
    });
    document.body.appendChild(nav);
    mobileNav = nav;
    return nav;
  };

  const closeMobile = (): void => {
    mobileNav?.classList.remove('is-open');
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  burger?.addEventListener('click', () => {
    const nav = buildMobileNav();
    const isOpen = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Scroll state via IntersectionObserver on a 1px sentinel — no scroll listener,
  // no jank, no main-thread work on every scroll frame.
  const sentinel = document.querySelector<HTMLElement>('[data-scroll-sentinel]');
  if (sentinel && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px 0px -100% 0px' }
    );
    io.observe(sentinel);
  }

  // Anchor smoothing — respects header offset, no CSS-only alternative gives this.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      (header.offsetHeight - 12);
    window.scrollTo({ top, behavior: 'smooth' });
  });
}
