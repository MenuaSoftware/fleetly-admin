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

export interface SubcontractorSummary {
  id: string;
  name: string;
}

export interface DriverSummary {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  subcoId: string;
}

export interface VehicleSummary {
  id: string;
  plate: string;
  bodyType: "van" | "truck" | "car";
  status: "active" | "out_of_service";
  subcoId: string;
}
