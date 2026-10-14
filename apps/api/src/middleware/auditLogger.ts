import { UserRole } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface AuditLogParams {
  userId: string;
  userName: string;
  userRole: UserRole;
  organizationName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAuditEvent(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        organizationName: params.organizationName,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: (params.details || {}) as any,
        ipAddress: params.ipAddress || '127.0.0.1'
      }
    });
  } catch (err) {
    console.error('[AuditLog] Failed to persist audit record:', err);
  }
}
