import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma.js';
import { config } from '../../config/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';
import { logAuditEvent } from '../../middleware/auditLogger.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or inactive account',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or inactive account',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    // Audit log
    await logAuditEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      organizationName: user.organization.name,
      action: 'USER_LOGIN',
      resourceType: 'AUTH',
      resourceId: user.id,
      details: { email: user.email },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      token,
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

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

export default router;
