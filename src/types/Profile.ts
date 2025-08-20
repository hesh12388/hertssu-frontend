export interface UserProfileResponse {
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
    tasks: TaskSummary[];
    performanceEvaluations: PerformanceEvaluation[];
    warnings: WarningSummary[];
    performanceStats: PerformanceStats;
}

export interface TaskSummary {
    id: number;
    title: string;
    status: 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: string;
    createdAt: string;
    submittedAt?: string;
    assignerName: string;
}

export interface PerformanceEvaluation {
    meetingTitle: string;
    meetingDate: string;
    performance: number;
    communication: number;
    teamwork: number;
    evaluatorName: string;
    createdAt: string;
    notes?: string;
    isLate:boolean;
    attendance:boolean;
}

export interface WarningSummary {
    id: number;
    reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    issuedDate: string;
    assignerName: string;
    actionTaken?: string;
}

export interface PerformanceStats {
    avgTeamwork: number;
    avgPerformance: number;
    avgCommunication: number;
    overallAverage: number;
    totalEvaluations: number;
}
