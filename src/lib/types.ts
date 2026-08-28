export interface StaffMe {
  kind: "staff";
  staffUserId: string;
  subcoId: string | null;
  role: "dispatcher" | "general_admin";
}

export interface StaffSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: "dispatcher" | "general_admin";
  status: string;
  subcoId: string | null;
}
