import { CommitteeType, SubcommitteeType } from "./User";

export interface InterviewType {
  id: string;
  name: string;
  gafEmail: string;
  phoneNumber: string;
  gafId: string;
  position: string;
  committee: CommitteeType;
  subCommittee: SubcommitteeType | null;
  startTime: string; 
  endTime: string;  
  status: 'SCHEDULED' | 'LOGGED';
  performance?: number;
  experience?: number;
  communication?: number;
  teamwork?: number;
  confidence?: number;
  accepted?: boolean;
  notes?: string;
  interviewerName: string;
  interviewerEmail: string;
  supervisorName?: string;
  supervisorEmail?: string;
  meetingId?: string;
  joinUrl?: string;
}