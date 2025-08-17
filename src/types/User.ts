export interface User {
  name: string;
  email: string;
  role: string;
  committeeId: number | null;
  subcommitteeId: number | null;
}

export interface UserType {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    committeeId: number;
    committeeName: string;
    subcommitteeId?: number;
    subcommitteeName?: string;
}

export interface CommitteeType {
    id: number;
    name: string;
}

export interface SubcommitteeType {
    id: number;
    name: string;
    committeeId: number;
}

export interface AccountRequestDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    committeeId: number;
    committeeName: string;
    subcommitteeId?: number;
    subcommitteeName?: string;
    interviewId: string;
    gafId: string;
    phoneNumber: string;
    requestedAt: string;
    notes?: string;
}