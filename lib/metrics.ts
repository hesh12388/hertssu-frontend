import { useMemo } from 'react';
import type { RatingCategories } from './data';
import { meetings, ratings, tasks, warnings } from './data';

export const fmtPct = (v: number) => `${Math.round(v)}%`;
export function isoToDate(iso: string): Date { return new Date(iso + 'T00:00:00'); }

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(isoToDate(b).getTime() - isoToDate(a).getTime());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function weekKey(iso: string): string {
  const d = isoToDate(iso);
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThursday = tmp.getTime();
  tmp.setUTCMonth(0, 1);
  const dayNum0 = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum0 + 3);
  const week = 1 + Math.round((firstThursday - tmp.getTime()) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${week}`;
}

export function useUserMetrics(userId: number) {
  return useMemo(() => {
    const userMeetings = meetings.filter(m => m.participants.includes(userId));
    const userRatings = ratings.filter(r => r.userId === userId);

    const attended = userRatings.filter(r => r.attended).length;
    const total = userMeetings.length || userRatings.length;
    const attendancePercent = total > 0 ? (attended / total) * 100 : 0;
    const noShows = Math.max(0, total - attended);

    const userTasks = tasks.filter(t => t.assigneeId === userId);
    const openTasks = userTasks.filter(t => t.status === 'Open');
    const closedTasks = userTasks.filter(t => t.status === 'Closed');
    const overdueOpen = openTasks.filter(t => t.dueAt && isoToDate(t.dueAt!) < new Date());

    const avgCompletionDays = (() => {
      const deltas = closedTasks
        .filter(t => t.completedAt)
        .map(t => daysBetween(t.createdAt, t.completedAt!));
      return deltas.length ? (deltas.reduce((a,b)=>a+b,0) / deltas.length) : 0;
    })();

    const onTimeRate = (() => {
      const closedWithDue = closedTasks.filter(t => t.dueAt);
      const onTime = closedWithDue.filter(t => t.completedAt && isoToDate(t.completedAt!) <= isoToDate(t.dueAt!));
      return closedWithDue.length ? (onTime.length / closedWithDue.length) * 100 : 0;
    })();

    const perfAvg = (() => {
      const vals = userRatings.map(r => r.overall);
      return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
    })();

    const closedPerWeekMap: Record<string, number> = {};
    closedTasks.forEach(t => {
      const wk = weekKey(t.completedAt || t.createdAt);
      closedPerWeekMap[wk] = (closedPerWeekMap[wk] || 0) + 1;
    });
    const closedPerWeek = Object.entries(closedPerWeekMap)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k,v]) => ({ x: k.slice(5), y: v }));

    const completionRateSeries = (() => {
      const allWeeks = new Set<string>();
      userTasks.forEach(t => {
        allWeeks.add(weekKey(t.createdAt));
        if (t.completedAt) allWeeks.add(weekKey(t.completedAt));
      });
      const weeks = Array.from(allWeeks).sort();
      return weeks.map(wk => {
        const tasksUpToWk = userTasks.filter(t => weekKey(t.createdAt) <= wk);
        const closedUpToWk = tasksUpToWk.filter(t => t.status === 'Closed' || (t.completedAt && weekKey(t.completedAt) <= wk));
        const rate = tasksUpToWk.length ? (closedUpToWk.length / tasksUpToWk.length) * 100 : 0;
        return { x: wk.slice(5), y: Math.round(rate) };
      });
    })();

    const categories: (keyof RatingCategories)[] = ['collaboration','communication','preparation','problemSolving','punctuality','reliability'];
    const catStats = categories.map(k => {
      const vals = userRatings.map(r => r.scores[k] ?? null).filter((v): v is number => v !== null && v !== 0);
      const mean = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
      return { key: k, mean, n: vals.length };
    }).filter(s => s.n >= 2).sort((a,b) => b.mean - a.mean).slice(0,3);

    const userWarnings = warnings.filter(w => w.userId === userId).sort((a,b) => b.issuedAt.localeCompare(a.issuedAt));
    const activeWarnings = userWarnings.filter(w => w.status === 'Active');

    return {
      attendancePercent,
      noShows,
      perfAvg,
      openTasks,
      closedTasks,
      overdueOpen,
      avgCompletionDays,
      onTimeRate,
      closedPerWeek,
      completionRateSeries,
      catStats,
      userWarnings,
      activeWarnings,
      userMeetings,
      userRatings,
    };
  }, [userId]);
}

export function prettyCat(k: keyof RatingCategories) {
  switch (k) {
    case 'problemSolving': return 'Problem solving';
    case 'punctuality': return 'Punctuality';
    case 'collaboration': return 'Collaboration';
    case 'communication': return 'Communication';
    case 'preparation': return 'Preparation';
    case 'reliability': return 'Reliability';
  }
}