export interface UserSummaryType {
    id: number;
    name: string;
    email: string;
}

export interface TaskType {
    id: number;
    title: string;
    description: string;
    assignee: UserSummaryType;
    assigner: UserSummaryType;
    startDate: string;
    dueDate: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
}


export const getAssignerName = (task: TaskType): string => task.assigner.name;
export const getAssignerEmail = (task: TaskType): string => task.assigner.email;
export const getAssigneeName = (task: TaskType): string => task.assignee.name;
export const getAssigneeEmail = (task: TaskType): string => task.assignee.email;

export interface TaskCommentType {
    id: string;
    content: string;
    user: UserSummaryType;
    createdAt: string;
    updatedAt: string;
}

export interface TaskDocumentType {
    id: string;
    taskId: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    uploadedBy: UserSummaryType;
    uploadedAt: string;
}

export interface AssignableUserType {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}


export const getFullName = (user: AssignableUserType): string => {
    return `${user.firstName} ${user.lastName}`;
};

export const formatPriority = (priority: string): string => {
    switch (priority) {
        case 'LOW':
            return 'Low';
        case 'MEDIUM':
            return 'Medium';
        case 'HIGH':
            return 'High';
        default:
            return priority;
    }
};

export const getPriorityColor = (priority: string): string => {
    switch (priority) {
        case 'LOW':
            return '#4CAF50';
        case 'MEDIUM':
            return '#FF9800';
        case 'HIGH':
            return '#F44336';
        default:
            return '#666';
    }
};

export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'IN_PROGRESS':
            return '#2196F3';
        case 'PENDING_REVIEW':
            return '#FF9800';
        case 'COMPLETED':
            return '#4CAF50';
        default:
            return '#666';
    }
};