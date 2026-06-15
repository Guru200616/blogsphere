import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DB } from '../config/db';
import { UserRole } from '../../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'blog_sphere_jwt_super_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required. Please authenticate.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    
    // Check if user still exists in DB
    const user = await DB.users.findOne({ id: decoded.id });
    if (!user) {
      res.status(403).json({ message: 'User account has been deleted or deactivated.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated request.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        message: `Forbidden: Access restricted. Required roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}` 
      });
      return;
    }

    next();
  };
}
