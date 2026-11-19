import { create } from 'zustand';
import type { PuzzleProgress } from '@/domain/rewards/puzzle';
import type { RewardState } from '@/domain/rewards/seriesRewards';
import type { Profile } from '@/domain/types';
import { getActiveProfile, setActiveProfileId } from '@/data/profiles';
import { getRewards, listPuzzles } from '@/data/rewards';

interface ProfileState {
  /** none : aucun profil, il faut passer par l'onboarding. */
  status: 'loading' | 'ready' | 'none';
  profile: Profile | null;
  rewards: RewardState | null;
  puzzles: PuzzleProgress[];
  load: () => Promise<void>;
  select: (profileId: string) => Promise<void>;
}

export const useProfile = create<ProfileState>()((set) => ({
  status: 'loading',
  profile: null,
  rewards: null,
  puzzles: [],
  async load() {
    let profile: Profile | undefined;
    try {
      profile = await getActiveProfile();
    } catch (error) {
      // IndexedDB indisponible : on repart de l'onboarding (les données ne persisteront pas).
      console.error(error);
    }
    if (!profile) {
      set({ status: 'none', profile: null, rewards: null, puzzles: [] });
      return;
    }
    const [rewards, puzzles] = await Promise.all([getRewards(profile.id), listPuzzles(profile.id)]);
    set({ status: 'ready', profile, rewards, puzzles });
  },
  async select(profileId) {
    setActiveProfileId(profileId);
    await useProfile.getState().load();
  },
}));
