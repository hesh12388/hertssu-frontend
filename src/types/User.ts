export interface User {
  name: string;
  email: string;
  role: string;
  committeeId: number | null;
  subcommitteeId: number | null;
}