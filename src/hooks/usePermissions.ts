import { User } from "../types/User";

export function usePermissions(user: User | null) {
    const isMember = user?.role === 'member';
    const isFromCommittee = (committeeId: number) => user?.committeeId === committeeId;
    

    const isChairperson = user?.role === 'Chairperson';
    const isAssociateChair = user?.role === 'Associate Chairperson';
    const isLeader = user?.role === 'Leader';
    const isAssociateLeader = user?.role === 'Associate Leader';
    const isOfficer = user?.role === 'Officer';
    

    const isChairLevel = isChairperson || isAssociateChair;
    const isLeaderLevel = isLeader || isAssociateLeader;
    const isHigherLevel = isFromCommittee(1) || isOfficer;
    
    const canSeeWarnings = !isMember;
    const canSeeTeam = !isMember;
    const canSeeInterviews = isFromCommittee(2);
    const canSeeProposals = isFromCommittee(3) || isFromCommittee(4) || isFromCommittee(5) || isHigherLevel;
    
    const canCreateProposals = isChairLevel;
    const canCreateCrossCommitteeRequests = isLeaderLevel;
    const canRespondToProposals = isChairLevel || isLeaderLevel;
    const canRespondToCrossCommitteeRequests = isChairLevel || isLeaderLevel;
    const hasReadOnlyAccess = isHigherLevel;
    
    
    const showAssignedProposals = isChairLevel;
    const showMyProposals = isLeaderLevel;
    const showAllProposals = isHigherLevel;
    const showCrossCommitteeRequests = isChairLevel || isLeaderLevel;
    
    return {
        
        isMember,
        isFromCommittee,
        canSeeWarnings,
        canSeeTeam,
        canSeeInterviews,
        canSeeProposals,
        
        
        isChairperson,
        isAssociateChair,
        isLeader,
        isAssociateLeader,
        isOfficer,
        
       
        isChairLevel,
        isLeaderLevel,
        isHigherLevel,
        
       
        canCreateProposals,
        canCreateCrossCommitteeRequests,
        canRespondToProposals,
        canRespondToCrossCommitteeRequests,
        hasReadOnlyAccess,
        
        
        showAssignedProposals,
        showMyProposals,
        showAllProposals,
        showCrossCommitteeRequests,
    };
}