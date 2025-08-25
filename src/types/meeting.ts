export interface UserType {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface Page<T> {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
}

export interface MeetingType {
    meetingId: number;
    title: string;
    description: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    participants: UserType[];
    joinUrl: string;
    zoomMeetingId: string;
    createdBy: UserType;
    createdAt: string;
}

export interface CreateMeetingPayload {
    title: string;
    description: string;
    location: string;
    date: string;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
    participantIds: number[];
}

export interface UpdateMeetingPayload {
    title?: string;
    description?: string;
    location?: string;
    date?: string; 
    startTime?: string; 
    endTime?: string;
    isAllDay?: boolean;
    participantIds?: number[];
}

export interface EvaluationType {
    evaluationId: number;
    meetingId: number;
    meetingTitle: string;
    user: UserType;
    evaluatedBy: UserType;
    performance: number;
    attended: boolean;
    note: string;
    late: boolean;
    hasException: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEvaluationPayload {
    meetingId: number;
    userId: number;
    performance: number;
    attended: boolean;
    note?: string;
    late?: boolean;
    hasException?: boolean;
}

export interface UpdateEvaluationPayload {
    performance?: number;
    attended?: boolean;
    note?: string;
    late?: boolean;
    hasException?: boolean;
}

export const getFullName = (user: UserType): string => {
    return `${user.firstName} ${user.lastName}`;
};

export const formatMeetingTime = (startTime: string, endTime: string, isAllDay: boolean): string => {
    if (isAllDay) return 'All Day';
    return `${startTime} - ${endTime}`;
};

export const formatMeetingDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

export const isMeetingUpcoming = (dateString: string, startTime: string): boolean => {
    const meetingDateTime = new Date(`${dateString}T${startTime}`);
    return meetingDateTime > new Date();
};