// Eagerly import all photos as URL strings through Vite's glob import.
// Vite processes/optimizes them and gives us hashed URLs for free.

const family = import.meta.glob('../assets/family/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const loveStory = import.meta.glob('../assets/love-stroy/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const personal = import.meta.glob('../assets/personal/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const wedding = import.meta.glob('../assets/wedding-morning/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const numbered = import.meta.glob('../assets/[0-9]*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const toArr = (map: Record<string, string>): string[] =>
  Object.keys(map)
    .sort()
    .map((k) => map[k]);

export const photos = {
  family: toArr(family),
  loveStory: toArr(loveStory),
  personal: toArr(personal),
  wedding: toArr(wedding),
};

export type CategoryKey = 'family' | 'loveStory' | 'personal' | 'wedding';

import servicePersonalImg from '../assets/personal.webp?url';
import serviceFamilyImg from '../assets/family.webp?url';
import serviceBrideImg from '../assets/bride.webp?url';

export const serviceCardImages: Record<CategoryKey, string> = {
  personal: servicePersonalImg,
  family: serviceFamilyImg,
  loveStory: serviceFamilyImg,
  wedding: serviceBrideImg,
};

export const categoryLabel: Record<CategoryKey | 'gallery', string> = {
  family: 'Family',
  loveStory: 'Love story',
  personal: 'Personal',
  wedding: "Bride's morning",
  gallery: 'Gallery',
};

// Flat list used in the main gallery — interleave categories for visual variety.
const numArr = Object.keys(numbered)
  .sort((a, b) => {
    const na = parseInt(a.match(/(\d+)/)?.[1] || '0', 10);
    const nb = parseInt(b.match(/(\d+)/)?.[1] || '0', 10);
    return na - nb;
  })
  .map((k) => numbered[k]);

export const galleryPool: { url: string; category: CategoryKey | 'gallery' }[] = (() => {
  const numItems = numArr.map((url) => ({ url, category: 'gallery' as const }));
  const keys: CategoryKey[] = ['personal', 'family', 'wedding', 'loveStory'];
  const lists = keys.map((k) => photos[k].slice());
  const out: { url: string; category: CategoryKey | 'gallery' }[] = [];
  let added = true;
  while (added) {
    added = false;
    for (let i = 0; i < keys.length; i++) {
      const src = lists[i];
      const k = keys[i];
      if (src.length > 0) {
        out.push({ url: src.shift()!, category: k });
        added = true;
      }
    }
  }
  return [...numItems, ...out];
})();
