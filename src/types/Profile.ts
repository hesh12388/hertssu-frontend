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
    status: 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
    createdAt: string;
    submittedAt?: string;
    assignerName: string;
}

export interface PerformanceEvaluation {
    meetingTitle: string;
    meetingDate: string;
    performance: number;
    evaluatorName: string;
    createdAt: string;
    note: string;
    isLate:boolean;
    attendance:boolean;
    hasException: boolean;
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
    avgPerformance: number;
    totalEvaluations: number;
    totalAbsences: number;
    totalLateArrivals: number;
    totalExceptions: number;
    attendanceRate: number;
}
