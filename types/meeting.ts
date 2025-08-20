export type Meeting = {
  meetingId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  type?: string;
  location?: string;
  visibility?: string;
  description?: string;
  allDay?: boolean;
  recurrence?: string;
  participants?: string[];
  role?: string;
  department?: string;
  joinUrl?: string;
};

export type ParticipantLite = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

export type CreateMeetingPayload = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: string[];
  location: string;
  recurrenceRule?: string;
  isAllDay?: boolean;
  reminders?: number[];
  visibility?: "PUBLIC" | "PRIVATE" | "CONFIDENTIAL";
  recurrenceUntil?: string | null;
};

export type MeetingResponseDto = {
  meetingId: number;
  title: string;
  description: string | null;
  location: string | null;
  date: string;                // ISO date string
  startTime: string | null;    // "HH:mm:ss" or null
  endTime: string | null;
  isAllDay: boolean;
  participantEmails: string[];
  recurrenceRule?: string | null;
  recurrenceId?: string | null;
  recurrenceUntil?: string | null;
  reminders: number[];
  meetingStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  zoomMeetingId?: string | null;
  joinUrl?: string | null;
  participants: ParticipantLite[];
};
