import { useEffect, useState } from 'react';
import { now } from '@/app/clock';
import {
  activityByDay,
  errorRate,
  factsToWork,
  skillSummary,
  type SkillStatus,
} from '@/domain/parent/dashboard';
import type { RewardState } from '@/domain/rewards/seriesRewards';
import { dayKey } from '@/domain/time';
import type { FactState, Profile, Series } from '@/domain/types';
import { WORLDS } from '@/domain/worlds';
import { listFactStates, listRecentSeries } from '@/data/progress';
import { getRewards } from '@/data/rewards';
import { listSkillProgress, type SkillProgress } from '@/data/skills';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import { ActivityChart } from './ActivityChart';
import { factLabel } from './factLabel';

interface Data {
  facts: FactState[];
  series: Series[];
  skills: SkillProgress[];
  rewards: RewardState;
}

const STATUS_STYLE: Record<SkillStatus, string> = {
  new: 'bg-primary-soft text-ink',
  learning: 'bg-help-soft text-ink',
  solid: 'bg-success-soft text-ink',
};
const STATUS_ICON: Record<SkillStatus, string> = { new: '○', learning: '◐', solid: '●' };

const dateTime = (ts: number) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts);

export function Dashboard({ profile }: { profile: Profile }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      listFactStates(profile.id),
      listRecentSeries(profile.id, 500),
      listSkillProgress(profile.id),
      getRewards(profile.id),
    ]).then(([facts, series, skills, rewards]) => alive && setData({ facts, series, skills, rewards }));
    return () => {
      alive = false;
    };
  }, [profile.id]);

  if (!data) return null;
  const today = dayKey(now());
  const days = activityByDay(data.series, today);
  const totalMinutes = days.reduce((s, d) => s + d.minutes, 0);
  const totalSeries = days.reduce((s, d) => s + d.series, 0);
  const toWork = factsToWork(data.facts);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">{fr.parent.skillsTitle}</h2>
        {WORLDS.map((world) => (
          <div key={world.id} className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-soft">{fr.worlds[world.id]}</h3>
            <ul className="flex flex-col gap-2">
              {world.skills.map((skillId) => {
                const level =
                  data.skills.find((s) => s.skillId === skillId)?.level ?? profile.settings.startLevel;
                const sum = skillSummary(skillId, level, data.facts);
                return (
                  <li
                    key={skillId}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-2xl bg-surface p-3 sm:grid-cols-[14rem_9rem_1fr]"
                  >
                    <span className="font-bold">
                      {fr.parent.skillNames[skillId]}{' '}
                      <span className="font-normal text-ink-soft">({fr.parent.skillLevel(sum.level)})</span>
                    </span>
                    <span
                      className={`w-fit rounded-full px-3 py-0.5 text-sm font-bold ${STATUS_STYLE[sum.status]}`}
                    >
                      <span aria-hidden="true">{STATUS_ICON[sum.status]} </span>
                      {fr.parent.status[sum.status]}
                    </span>
                    <span className="col-span-2 flex items-center gap-3 sm:col-span-1">
                      <span
                        className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-soft"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(sum.mastered / sum.total) * 100}%` }}
                        />
                      </span>
                      <span className="text-sm whitespace-nowrap tabular-nums">
                        {fr.parent.mastered(sum.mastered, sum.total)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">{fr.parent.factsTitle}</h2>
        {toWork.length === 0 ? (
          <p className="text-ink-soft">{fr.parent.factsEmpty}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {toWork.map((s) => (
              <li
                key={s.factKey}
                className="flex items-baseline justify-between gap-3 rounded-2xl bg-surface p-3"
              >
                <span className="text-xl font-extrabold tabular-nums">{factLabel(s)}</span>
                <span className="text-right text-sm text-ink-soft">
                  {fr.parent.factErrors(Math.round(errorRate(s) * 100))} ·{' '}
                  {fr.parent.factTime((s.avgMs / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
        <ActivityChart days={days} />
        <p className="text-sm">
          {fr.parent.activitySummary(
            totalSeries,
            totalMinutes.toLocaleString('fr-FR', { maximumFractionDigits: 0 }),
          )}{' '}
          · {fr.parent.streak(data.rewards.streak.count, data.rewards.streak.best)}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">{fr.parent.historyTitle}</h2>
        {data.series.length === 0 ? (
          <p className="text-ink-soft">{fr.parent.historyEmpty}</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-sm text-ink-soft">
              <tr>
                <th className="py-1 font-bold">{fr.parent.columns.date}</th>
                <th className="font-bold">{fr.parent.columns.skill}</th>
                <th className="font-bold">{fr.parent.columns.game}</th>
                <th className="font-bold">
                  <span className="sr-only">{fr.parent.stars(3)}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.series.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-t border-ink/10">
                  <td className="py-2 pr-2">{dateTime(s.endedAt)}</td>
                  <td className="pr-2">{fr.parent.skillNames[s.skillId]}</td>
                  <td className="pr-2">{fr.games[s.gameId].name}</td>
                  <td aria-label={fr.parent.stars(s.stars)} className="whitespace-nowrap">
                    {[1, 2, 3].map((i) => (
                      <Icon
                        key={i}
                        name="star"
                        filled
                        className={`inline size-5 ${i <= s.stars ? 'text-[#f5b82e]' : 'text-primary-soft'}`}
                      />
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
