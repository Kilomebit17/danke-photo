import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/**
 * Reveal elements marked with `data-reveal` when they enter the viewport.
 * Groups siblings under a shared parent to stagger them naturally.
 */
export function initRevealOnScroll(root: ParentNode = document): void {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')
  );
  if (nodes.length === 0) return;

  if (prefersReducedMotion) {
    nodes.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.setAttribute('data-revealed', '');
    });
    return;
  }

  const groups = new Map<Element, HTMLElement[]>();
  nodes.forEach((n) => {
    const parent = n.parentElement ?? document.body;
    const arr = groups.get(parent) ?? [];
    arr.push(n);
    groups.set(parent, arr);
    n.setAttribute('data-revealed', '');
  });

  groups.forEach((items) => {
    gsap.to(items, {
      scrollTrigger: {
        trigger: items[0],
        start: 'top 88%',
        once: true,
      },
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.08,
    });
  });
}

export { gsap, ScrollTrigger };
