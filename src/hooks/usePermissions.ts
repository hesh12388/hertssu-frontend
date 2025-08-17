import { User } from "../types/User";

export function usePermissions(user: User | null) {
    const isMember = user?.role === 'member';
    const isFromCommittee = (committeeId: number) => user?.committeeId === committeeId;
    

    const isChairperson = user?.role === 'CHAIR_PERSON';
    const isAssociateChair = user?.role === 'ASSOCIATE_CHAIRPERSON';
    const isLeader = user?.role === 'LEADER';
    const isAssociateLeader = user?.role === 'ASSOCIATE_LEADER';
    const isOfficer = user?.role === 'OFFICER';
    

    const isChairLevel = isChairperson || isAssociateChair;
    const isLeaderLevel = isLeader || isAssociateLeader;
    const isHigherLevel = isFromCommittee(2) || isOfficer;
    
    const canSeeWarnings = !isMember;
    const canSeeTeam = !isMember;
    const canSeeInterviews = isFromCommittee(1);
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