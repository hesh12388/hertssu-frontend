import { User } from "@/App";

export function usePermissions(user: User | null) {
  const isMember = user?.role === 'member';

  const isFromCommittee = (committeeId: number) =>
    user?.committeeId === committeeId;

  const canSeeWarnings = !isMember;
  const canSeeTeam = !isMember;
  const canSeeInterviews = isFromCommittee(1);
  const canSeeProposals = isFromCommittee(3) || isFromCommittee(4);

  return {
    isMember,
    isFromCommittee,
    canSeeWarnings,
    canSeeTeam,
    canSeeInterviews,
    canSeeProposals,
  };
}
