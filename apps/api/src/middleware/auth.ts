import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationType: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) || (req.query?.token as string);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid',
      code: 'UNAUTHORIZED'
    });
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or deactivated',
        code: 'USER_INACTIVE'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      organizationType: user.organization.type
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token',
      code: 'TOKEN_INVALID'
    });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.role === UserRole.ADMIN) {
      return next(); // Admins have system oversight
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
        code: 'FORBIDDEN_ROLE'
      });
    }

    next();
  };
}
