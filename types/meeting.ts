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
};

export type CreateMeetingPayload = Omit<
  Meeting,
  "meetingId" | "role" | "department"
>;
