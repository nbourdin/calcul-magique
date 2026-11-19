export const AVATARS = ['star', 'moon', 'flower', 'heart', 'cloud', 'crown'] as const;
export type AvatarId = (typeof AVATARS)[number];

export function isAvatarId(id: string): id is AvatarId {
  return (AVATARS as readonly string[]).includes(id);
}
