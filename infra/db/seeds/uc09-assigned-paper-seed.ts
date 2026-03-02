export interface Uc09AssignmentSeed {
  assignmentId: string;
  refereeUserId: string;
  paperId: string;
  reviewFormId: string;
  status: "ACTIVE" | "UNAVAILABLE" | "REVOKED";
  invitationStatus: "ACCEPTED" | "PENDING" | "REJECTED";
}

export const UC09_ASSIGNED_PAPER_SEED: Uc09AssignmentSeed[] = [
  {
    assignmentId: "a0900000-0000-4000-8000-000000000901",
    refereeUserId: "u0900000-0000-4000-8000-000000000901",
    paperId: "p0900000-0000-4000-8000-000000000901",
    reviewFormId: "f0900000-0000-4000-8000-000000000901",
    status: "ACTIVE",
    invitationStatus: "ACCEPTED"
  }
];
