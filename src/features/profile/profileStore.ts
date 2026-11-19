import { create } from 'zustand';
import { now } from '@/app/clock';
import type { PuzzleProgress } from '@/domain/rewards/puzzle';
import type { RewardState } from '@/domain/rewards/seriesRewards';
import type { FactState, Profile } from '@/domain/types';
import { getActiveProfile, setActiveProfileId } from '@/data/profiles';
import { listFactStates } from '@/data/progress';
import { dailyDoneToday, getRewards, listPuzzles } from '@/data/rewards';
import { listSkillProgress, type SkillProgress } from '@/data/skills';

interface ProfileState {
  /** none : aucun profil, il faut passer par l'onboarding. */
  status: 'loading' | 'ready' | 'none';
  profile: Profile | null;
  rewards: RewardState | null;
  puzzles: PuzzleProgress[];
  skills: SkillProgress[];
  /** États Leitner : servent à ouvrir les mondes. */
  facts: FactState[];
  /** Défi du jour déjà relevé aujourd'hui. */
  dailyDone: boolean;
  load: () => Promise<void>;
  select: (profileId: string) => Promise<void>;
}

export const useProfile = create<ProfileState>()((set) => ({
  status: 'loading',
  profile: null,
  rewards: null,
  puzzles: [],
  skills: [],
  facts: [],
  dailyDone: false,
  async load() {
    let profile: Profile | undefined;
    try {
      profile = await getActiveProfile();
    } catch (error) {
      // IndexedDB indisponible : on repart de l'onboarding (les données ne persisteront pas).
      console.error(error);
    }
    if (!profile) {
      set({
        status: 'none',
        profile: null,
        rewards: null,
        puzzles: [],
        skills: [],
        facts: [],
        dailyDone: false,
      });
      return;
    }
    const [rewards, puzzles, skills, facts, dailyDone] = await Promise.all([
      getRewards(profile.id),
      listPuzzles(profile.id),
      listSkillProgress(profile.id),
      listFactStates(profile.id),
      dailyDoneToday(profile.id, now()),
    ]);
    set({ status: 'ready', profile, rewards, puzzles, skills, facts, dailyDone });
  },
  async select(profileId) {
    setActiveProfileId(profileId);
    await useProfile.getState().load();
  },
}));
