const numbered = import.meta.glob('../assets/[0-9]*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export type ServiceCardKey = 'personal' | 'loveStory' | 'wedding';

import servicePersonalImg from '../assets/personal.webp?url';
import serviceFamilyImg from '../assets/family.webp?url';
import serviceBrideImg from '../assets/bride.webp?url';

export const serviceCardImages: Record<ServiceCardKey, string> = {
  personal: servicePersonalImg,
  loveStory: serviceFamilyImg,
  wedding: serviceBrideImg,
};

export const categoryLabel: Record<ServiceCardKey | 'gallery', string> = {
  personal: 'Personal',
  loveStory: 'Love story',
  wedding: "Bride's morning",
  gallery: 'Gallery',
};

const numArr = Object.keys(numbered)
  .sort((a, b) => {
    const na = parseInt(a.match(/(\d+)/)?.[1] || '0', 10);
    const nb = parseInt(b.match(/(\d+)/)?.[1] || '0', 10);
    return na - nb;
  })
  .map((k) => numbered[k]);

export const galleryPool: { url: string; category: 'gallery' }[] =
  numArr.map((url) => ({ url, category: 'gallery' }));
