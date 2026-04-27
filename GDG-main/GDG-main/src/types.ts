
export enum EmergencyType {
  MEDICAL = 'Medical',
  FIRE = 'Fire',
  SECURITY = 'Security'
}

export enum AlertStatus {
  ALERTING = 'Alerting Staff',
  HOSPITAL_ASSIGNED = 'Hospital Assigned',
  AMBULANCE_EN_ROUTE = 'Ambulance En Route',
  RESOLVED = 'Resolved'
}

export interface Hospital {
  id: string;
  name: string;
  bedsAvailable: number;
  specialty: string;
  distance: number; // Mock distance in km
}

export interface Alert {
  id: string;
  guestName: string;
  roomNumber: string;
  type: EmergencyType;
  status: AlertStatus;
  createdAt: string;
  location?: {
    lat: number;
    lng: number;
  };
  assignedHospital?: string;
  aiReasoning?: string;
  eta?: string;
}
