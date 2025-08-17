export interface InterviewType {
  id: string;
  name: string;
  gafEmail: string;
  phoneNumber: string;
  gafId: string;
  position: string;
  committee: string;
  subCommittee: string;
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
  

  meetingId?: string;
  joinUrl?: string;
}