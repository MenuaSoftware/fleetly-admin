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

export interface PendingDeviceSummary {
  id: string;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  requestedAt: string;
}

export interface TripSummary {
  id: string;
  state: "active" | "completed" | "force_closed";
  origin: string;
  driverId: string;
  driverName: string | null;
  vehicleId: string;
  vehiclePlate: string | null;
  startOdometer: number;
  endOdometer: number | null;
  distance: number | null;
  startedAt: string;
  endedAt: string | null;
  closureReasonCode: string | null;
}

export interface TripConfirmationSummary {
  phase: "opening" | "closing";
  clientTime: string;
  serverTime: string;
  locationLat: number | null;
  locationLng: number | null;
  acknowledgedDamageIds: string[];
}

export interface TripPhotoSummary {
  id: string;
  photoType: "front" | "left" | "right" | "rear";
  status: string;
  uploadedAt: string | null;
}

export interface TripDamageSummary {
  id: string;
  view: string;
  status: string;
  reportedPhase: string | null;
}

export interface TripShareSummary {
  id: string;
  subcoId: string;
  subcoName: string | null;
  grantedAt: string;
  revokedAt: string | null;
}

export interface TripDetail extends TripSummary {
  confirmations: TripConfirmationSummary[];
  photos: TripPhotoSummary[];
  damage: TripDamageSummary[];
  shares: TripShareSummary[];
}

export interface IncidentSummary {
  id: string;
  type: "new_damage" | "breakdown";
  driverId: string;
  driverName: string | null;
  vehicleId: string;
  vehiclePlate: string | null;
  tripId: string | null;
  note: string;
  locationLat: number | null;
  locationLng: number | null;
  capturedAt: string;
}

export interface DocumentTypeSummary {
  id: string;
  subcoId: string | null;
  attachedTo: "vehicle" | "driver";
  name: string;
  alertWindowDays: number;
}
