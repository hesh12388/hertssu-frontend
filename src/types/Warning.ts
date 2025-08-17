export interface WarningRequest {
    assigneeId: number;
    reason: string;
    actionTaken?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WarningResponse {
    id: number;
    assigner: UserSummary;
    assignee: UserSummary;
    issuedDate: string;
    reason: string;
    actionTaken?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: string;
    updatedAt?: string;
}

export interface UserSummary {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    committee: string;
    subcommittee: string;
}
