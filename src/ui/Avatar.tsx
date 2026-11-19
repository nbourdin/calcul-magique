import { fr } from '@/i18n/fr';
import { isAvatarId, type AvatarId } from './avatars';

const art: Record<AvatarId, { bg: string; fg: string; d: string }> = {
  star: {
    bg: '#fff1c9',
    fg: '#f5b82e',
    d: 'M32 10l6.5 13.5 14.8 1.9-10.9 10.2 2.8 14.7L32 43l-13.2 7.3 2.8-14.7-10.9-10.2 14.8-1.9z',
  },
  moon: { bg: '#e8defa', fg: '#7b5cc4', d: 'M38 12a20 20 0 1 0 14 34 16 16 0 1 1-14-34z' },
  flower: {
    bg: '#fbe0ea',
    fg: '#e76f8a',
    d: 'M32 22a7 7 0 1 1 7 7 7 7 0 1 1-7 7 7 7 0 1 1-7-7 7 7 0 1 1 7-7zm0 5a4 4 0 1 0 0 8 4 4 0 1 0 0-8z',
  },
  heart: {
    bg: '#fdebd6',
    fg: '#e8743b',
    d: 'M32 50S12 38 12 24a10 10 0 0 1 20-3 10 10 0 0 1 20 3c0 14-20 26-20 26z',
  },
  cloud: { bg: '#d6ecfb', fg: '#4f8fc9', d: 'M20 46a10 10 0 0 1 0-20 13 13 0 0 1 25-3 11 11 0 0 1 1 23z' },
  crown: { bg: '#d8f3e8', fg: '#2f8f5b', d: 'M12 44l4-24 10 10 6-14 6 14 10-10 4 24z' },
};

export function Avatar({
  id,
  className = 'size-14',
  label = false,
}: {
  id: string;
  className?: string;
  label?: boolean;
}) {
  const a = art[isAvatarId(id) ? id : 'star'];
  return (
    <svg
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label && isAvatarId(id) ? fr.avatars[id] : undefined}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="32" cy="32" r="31" fill={a.bg} stroke="#2e2a4f" strokeWidth="2" />
      <path d={a.d} fill={a.fg} stroke="#2e2a4f" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
