export interface MeetingResponseDto {
  meetingId: number;
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  participants: UserDto[];
  createdAt: string;
  updatedAt: string;
  zoomMeetingId: string;
  joinUrl: string;
}

export interface Page<T> {
  content: T[];
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}


export type CreateMeetingPayload = {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  participantIds: number[];
}


export type UserDto = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

export type EvaluationResponseDto = {
  evaluationId: number;      // server: Long
  meetingId: number;
  meetingTitle: string;
  user: UserDto;             // the participant being evaluated
  evaluatedBy: UserDto;      // the evaluator
  performance: number;       // 1..10
  attended: boolean;
  note: string;              // free text up to 500 chars
  late: boolean;
  hasException: boolean;
  createdAt?: string;        // ISO string
  updatedAt?: string;        // ISO string
};

export type CreateEvaluationPayload = {
  meetingId: number;
  userId: number;            // participant user id
  performance: number;       // 1..10
  attended: boolean;
  note: string;
  late?: boolean;
  hasException?: boolean;
};

export type UpdateEvaluationPayload = {
  performance?: number;      // 1..10
  attended?: boolean;
  note?: string;
  late?: boolean;
  hasException?: boolean;
};

export type UpdateMeetingPayload = {
  title?: string;
  description?: string;
  location?: string;
  date?: string;             // yyyy-MM-dd
  startTime?: string;        // HH:mm
  endTime?: string;          // HH:mm
  isAllDay?: boolean;
  participantIds?: number[];
};