export type Role = 'Member' | 'Lead' | 'Manager' | 'Owner';

export type User = {
  id: number;
  name: string;
  role: Role;
  avatar?: string;
  tags: string[];
  groups: string[];
};

export type WarningType = 'Attendance' | 'Conduct' | 'Quality' | 'Deadline';
export type WarningStatus = 'Active' | 'Cleared';

export type Warning = {
  id: number;
  userId: number;
  type: WarningType;
  status: WarningStatus;
  issuedAt: string;
  clearedAt?: string;
  issuedByUserId: number;
  note?: string;
};

export type TaskStatus = 'Open' | 'Closed';
export type Task = {
  id: number;
  assigneeId: number;
  createdAt: string;
  dueAt?: string;
  completedAt?: string;
  status: TaskStatus;
  sourceMeetingId?: number;
};

export type RatingCategories = {
  collaboration?: number;
  communication?: number;
  preparation?: number;
  problemSolving?: number;
  punctuality?: number;
  reliability?: number;
};

export type Meeting = {
  id: number;
  title: string;
  date: string; // ISO
  ownerId: number;
  participants: number[];
};

export type MeetingRating = {
  meetingId: number;
  userId: number;
  ownerId: number;
  date: string; // ISO
  scores: RatingCategories;
  overall: number; // 1..10
  attended: boolean;
  late?: boolean;
};

export const users: User[] = [
  { id: 1, name: 'John Doe', role: 'Member', tags: ['#Engineering', '#AI_Team'], groups: ['Product Dev Committee'] },
  { id: 2, name: 'Jane Smith', role: 'Member', tags: ['#Ops'], groups: ['Operations'] },
  { id: 3, name: 'Alex Kim', role: 'Lead', tags: ['#Mobile'], groups: ['Product Dev Committee'] },
  { id: 4, name: 'Maria Garcia', role: 'Member', tags: ['#Frontend'], groups: ['Design Guild'] },
];

export const meetings: Meeting[] = [
  { id: 101, title: 'Sprint Planning', date: '2025-08-01', ownerId: 3, participants: [1,2,4] },
  { id: 102, title: 'Weekly Sync', date: '2025-08-05', ownerId: 3, participants: [1,2] },
  { id: 103, title: 'Retrospective', date: '2025-08-08', ownerId: 3, participants: [1,2,4] },
  { id: 104, title: 'Design Review', date: '2025-08-14', ownerId: 4, participants: [1,3] },
];

export const ratings: MeetingRating[] = [
  { meetingId: 101, userId: 1, ownerId: 3, date: '2025-08-01', overall: 8.5, attended: true, scores: { collaboration: 9, communication: 8, preparation: 8, problemSolving: 8, punctuality: 9, reliability: 9 } },
  { meetingId: 102, userId: 1, ownerId: 3, date: '2025-08-05', overall: 8.8, attended: true, scores: { collaboration: 9, communication: 9, preparation: 8, problemSolving: 9, punctuality: 10, reliability: 9 } },
  { meetingId: 103, userId: 1, ownerId: 3, date: '2025-08-08', overall: 7.6, attended: false, late: false, scores: { collaboration: 0, communication: 0, preparation: 0, problemSolving: 0, punctuality: 0, reliability: 0 } },
  { meetingId: 102, userId: 2, ownerId: 3, date: '2025-08-05', overall: 6.5, attended: true, scores: { collaboration: 7, communication: 6, preparation: 6, problemSolving: 6, punctuality: 7, reliability: 6 } },
  { meetingId: 103, userId: 2, ownerId: 3, date: '2025-08-08', overall: 6.2, attended: true, scores: { collaboration: 6, communication: 6, preparation: 6, problemSolving: 6, punctuality: 6, reliability: 6 } },
  { meetingId: 101, userId: 4, ownerId: 3, date: '2025-08-01', overall: 7.2, attended: true, scores: { collaboration: 7, communication: 7, preparation: 7, problemSolving: 7, punctuality: 7, reliability: 7 } },
];

export const tasks: Task[] = [
  { id: 201, assigneeId: 1, createdAt: '2025-07-25', dueAt: '2025-08-02', completedAt: '2025-08-01', status: 'Closed' },
  { id: 202, assigneeId: 1, createdAt: '2025-07-28', dueAt: '2025-08-03', completedAt: '2025-08-02', status: 'Closed' },
  { id: 203, assigneeId: 1, createdAt: '2025-08-04', dueAt: '2025-08-10', status: 'Open' },
  { id: 204, assigneeId: 1, createdAt: '2025-08-06', dueAt: '2025-08-08', completedAt: '2025-08-07', status: 'Closed' },
  { id: 205, assigneeId: 1, createdAt: '2025-08-07', dueAt: '2025-08-12', status: 'Open' },
  { id: 206, assigneeId: 2, createdAt: '2025-08-01', dueAt: '2025-08-04', completedAt: '2025-08-05', status: 'Closed' },
  { id: 207, assigneeId: 2, createdAt: '2025-08-06', dueAt: '2025-08-09', status: 'Open' },
];

export const warnings: Warning[] = [
  { id: 301, userId: 1, type: 'Attendance', status: 'Active', issuedAt: '2025-08-08', issuedByUserId: 3, note: 'Missed Retrospective without notice.' },
  { id: 302, userId: 2, type: 'Deadline', status: 'Cleared', issuedAt: '2025-07-10', clearedAt: '2025-07-20', issuedByUserId: 3, note: 'Late delivery in July, improved since.' },
];
