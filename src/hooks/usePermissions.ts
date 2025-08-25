import { User } from "../types/User";

export function usePermissions(user: User | null) {
    const isMember = user?.role === 'member';
    const isFromCommittee = (committeeId: number) => user?.committeeId === committeeId;
    

    const isChairperson = user?.role === 'CHAIRPERSON';
    const isAssociateChair = user?.role === 'ASSOCIATE_CHAIRPERSON';
    const isLeader = user?.role === 'LEADER';
    const isAssociateLeader = user?.role === 'ASSOCIATE_LEADER';
    const isOfficer = user?.role === 'OFFICER';
    

    const isChairLevel = isChairperson || isAssociateChair;
    const isLeaderLevel = isLeader || isAssociateLeader;
    const isHigherLevel = isFromCommittee(1) || isOfficer;
    
    const canSeeTeam = !isMember;
    const canSeeInterviews = isFromCommittee(3) || isHigherLevel;
    const canSeeProposals = (isFromCommittee(6) || isFromCommittee(8) || isFromCommittee(10) ||isFromCommittee(7) || isHigherLevel) && !isMember;
    
    const canCreateProposals = isChairLevel;
    
    
    const showAssignedProposals = isChairLevel;
    const showMyProposals = isLeaderLevel;
    const showAllProposals = isHigherLevel;
    const showCrossCommitteeRequests = isChairLevel || isLeaderLevel;
    
    return {
        
        isMember,
        isFromCommittee,
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
        showAssignedProposals,
        showMyProposals,
        showAllProposals,
        showCrossCommitteeRequests,
    };
}