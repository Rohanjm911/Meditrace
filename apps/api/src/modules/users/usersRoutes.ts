import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../../middleware/auth.js';
import { logAuditEvent } from '../../middleware/auditLogger.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().uuid()
});

router.get('/', authenticateToken, requireRoles(UserRole.ADMIN), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' }
    });

    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      organizationId: u.organizationId,
      organizationName: u.organization.name,
      organizationType: u.organization.type,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString()
    }));

    res.json({ success: true, users: safeUsers });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, requireRoles(UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const currentUser = req.user!;

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const passwordHash = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        organizationId: data.organizationId
      },
      include: { organization: true }
    });

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      organizationName: currentUser.organizationName,
      action: 'USER_CREATE',
      resourceType: 'USER',
      resourceId: user.id,
      details: { email: user.email, role: user.role, organization: user.organization.name }
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationType: user.organization.type,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticateToken, requireRoles(UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const currentUser = req.user!;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      include: { organization: true }
    });

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      organizationName: currentUser.organizationName,
      action: 'USER_STATUS_CHANGE',
      resourceType: 'USER',
      resourceId: user.id,
      details: { isActive }
    });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

router.get('/organizations', authenticateToken, async (_req, res, next) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, organizations: orgs });
  } catch (err) {
    next(err);
  }
});

export default router;
