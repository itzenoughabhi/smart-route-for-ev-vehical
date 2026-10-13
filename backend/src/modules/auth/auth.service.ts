import { User, UserRole, AuthSession } from './auth.types';

export class AuthService {
  private static instance: AuthService;
  private users: Map<string, User> = new Map();
  private sessions: Map<string, AuthSession> = new Map();

  private constructor() {
    this.seedDemoUsers();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private seedDemoUsers() {
    const demoUsers: User[] = [
      {
        id: 'usr-owner-01',
        email: 'owner@evnexus.io',
        name: 'Rahul Sharma',
        role: 'EV_OWNER',
        organization: 'Private Vehicle Owner',
        assignedVehicleIds: ['veh-ev-024', 'veh-ev-057'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-mfg-01',
        email: 'tata.analytics@tatamotors.com',
        name: 'Dr. Ananya Sen',
        role: 'EV_MANUFACTURER',
        organization: 'Tata Motors Electric Mobility Division',
        manufacturerBrand: 'Tata Motors EV',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-station-01',
        email: 'station.owner@nexuspower.in',
        name: 'Vikram Patel',
        role: 'STATION_OWNER',
        organization: 'Patel Fuels & EV Charging Stations LLP',
        assignedStationIds: ['st-a102', 'st-b104', 'st-d305'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-rescue-01',
        email: 'rescue.ops@palghar-towing.gov.in',
        name: 'Inspector Sanjay Raut',
        role: 'RESCUE_OPERATOR',
        organization: 'Palghar Highway Rescue & Rapid Towing Command',
        rescueProviderId: 'prov-rapid-tow-01',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-admin-01',
        email: 'admin@evnexus.io',
        name: 'Chief Network Controller',
        role: 'PLATFORM_ADMIN',
        organization: 'EVNEXUS Digital Twin Operations',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const u of demoUsers) {
      this.users.set(u.id, u);
      // Pre-seed instant login token
      const token = `token-${u.id}`;
      this.sessions.set(token, {
        token,
        user: u,
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      });
    }
  }

  public getAllDemoUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  public createSession(user: User): AuthSession {
    const token = `token-${user.id}-${Date.now()}`;
    const session: AuthSession = {
      token,
      user,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    this.sessions.set(token, session);
    return session;
  }

  public validateSession(token: string): User | null {
    if (!token) return null;
    const cleanToken = token.replace('Bearer ', '').trim();
    const session = this.sessions.get(cleanToken);
    if (!session) {
      // Fallback: check if matches static token-usr-* pattern
      const user = Array.from(this.users.values()).find((u) => cleanToken === `token-${u.id}`);
      return user || null;
    }
    return session.user;
  }

  public switchRoleDemo(role: UserRole): AuthSession {
    const user = Array.from(this.users.values()).find((u) => u.role === role);
    if (!user) throw new Error(`Demo user for role ${role} not found`);
    return this.createSession(user);
  }
}

export const authService = AuthService.getInstance();
