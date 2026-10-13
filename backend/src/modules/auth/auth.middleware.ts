import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { User, UserRole } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (!authHeader) {
    // If no header provided, try demo query param or default to admin in non-strict demo mode
    const demoRole = req.query.demoRole as UserRole;
    if (demoRole) {
      const user = authService.getAllDemoUsers().find((u) => u.role === demoRole);
      if (user) {
        req.user = user;
        return next();
      }
    }
    // Allow anonymous read for public routes or treat as anonymous
    return next();
  }

  const user = authService.validateSession(authHeader);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check auth
    if (!req.user) {
      // Check query param for easy frontend testing
      const queryRole = req.query.role as UserRole;
      if (queryRole && allowedRoles.includes(queryRole)) {
        const demoUser = authService.getAllDemoUsers().find((u) => u.role === queryRole);
        if (demoUser) {
          req.user = demoUser;
          return next();
        }
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'PLATFORM_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: role '${req.user.role}' lacks permission for this resource. Required: ${allowedRoles.join(', ')}`,
    });
  };
}
