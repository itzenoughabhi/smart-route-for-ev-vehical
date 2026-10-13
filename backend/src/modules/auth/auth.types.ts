export type UserRole = 
  | 'EV_OWNER'
  | 'EV_MANUFACTURER'
  | 'STATION_OWNER'
  | 'RESCUE_OPERATOR'
  | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  // Associated entities for tenant scoping:
  assignedVehicleIds?: string[];      // For EV_OWNER: vehicle IDs they own
  assignedStationIds?: string[];      // For STATION_OWNER: stations they operate
  manufacturerBrand?: string;         // For EV_MANUFACTURER: e.g. "Tata Motors EV"
  rescueProviderId?: string;          // For RESCUE_OPERATOR: e.g. "prov-quick-tow-01"
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}
