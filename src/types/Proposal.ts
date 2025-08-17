export interface CommitteeSummaryType {
    id: number;
    committeeName: string;
    commiteeSlug: string;
}

export interface ProposalType {
    id: number;
    title: string;
    description: string;
    assignee: CommitteeSummaryType;  // Subcommittee
    assigner: CommitteeSummaryType;  // Committee
    startDate?: string;
    dueDate: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
}

export interface CrossCommitteeRequestType {
    id: number;
    proposalId: number;
    title: string;
    description: string;
    requester: CommitteeSummaryType;     // Subcommittee
    targetCommittee: CommitteeSummaryType; // Committee
    status: 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
}

export interface CommentType {
    id: string;
    content: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface DocumentType {
    id: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    uploadedBy: {
        id: number;
        name: string;
        email: string;
    };
    uploadedAt: string;
}
