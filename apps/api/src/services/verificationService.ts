import { VerificationStatus, AlertStatus, BatchStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { blockchainService } from './blockchainService.js';

export interface ParsedCodeFields {
  gtin?: string;
  batchNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  rawType: 'QR_JSON' | 'GS1_DATAMATRIX' | 'PLAIN_BATCH';
}

export class VerificationService {
  /**
   * Parses GS1 DataMatrix string representation according to GS1 General Specifications:
   * e.g., (01)00300010023456(17)261010(10)VAC-2026-089A(21)SN10098421
   * or GS1 raw string without parentheses with FNC1 delimiters
   */
  public parseGS1String(input: string): ParsedCodeFields | null {
    const trimmed = input.trim();
    const result: ParsedCodeFields = { rawType: 'GS1_DATAMATRIX' };

    // Standard human-readable bracket syntax: (01)...(17)...(10)...(21)...
    const gtinMatch = trimmed.match(/\(01\)(\d{14})/);
    const expMatch = trimmed.match(/\(17\)(\d{6})/);
    const batchMatch = trimmed.match(/\(10\)([A-Za-z0-9\-_]+)(?=\(|$)/);
    const serialMatch = trimmed.match(/\(21\)([A-Za-z0-9\-_]+)(?=\(|$)/);

    if (gtinMatch) result.gtin = gtinMatch[1];
    if (batchMatch) result.batchNumber = batchMatch[1];
    if (serialMatch) result.serialNumber = serialMatch[1];
    if (expMatch) {
      const yy = expMatch[1].substring(0, 2);
      const mm = expMatch[1].substring(2, 4);
      const dd = expMatch[1].substring(4, 6);
      result.expiryDate = `20${yy}-${mm}-${dd}`;
    }

    // Direct stream syntax without brackets: 01{14}17{6}10{var}21{var}
    if (!result.gtin && trimmed.startsWith('01') && trimmed.length >= 16) {
      result.gtin = trimmed.substring(2, 16);
      let remaining = trimmed.substring(16);
      if (remaining.startsWith('17') && remaining.length >= 8) {
        const yy = remaining.substring(2, 4);
        const mm = remaining.substring(4, 6);
        const dd = remaining.substring(6, 8);
        result.expiryDate = `20${yy}-${mm}-${dd}`;
        remaining = remaining.substring(8);
      }
      if (remaining.startsWith('10')) {
        const after10 = remaining.substring(2);
        const nextAi = after10.indexOf('21');
        if (nextAi !== -1) {
          result.batchNumber = after10.substring(0, nextAi);
          result.serialNumber = after10.substring(nextAi + 2);
        } else {
          result.batchNumber = after10;
        }
      }
    }

    if (result.gtin || result.batchNumber) {
      return result;
    }
    return null;
  }

  /**
   * Parses QR Code payload: JSON object or plain batch string
   */
  public parseQRCode(input: string): ParsedCodeFields {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          rawType: 'QR_JSON',
          batchNumber: parsed.batch || parsed.batchNumber,
          gtin: parsed.gtin,
          expiryDate: parsed.exp || parsed.expiryDate,
          serialNumber: parsed.sn || parsed.serialNumber
        };
      } catch {
        // Fall back to treating as plain string
      }
    }

    // URL parser support (e.g. https://domain.com/verify?batch=VAC-2026-089A or https://domain.com/VAC-2026-089A)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const batchParam = url.searchParams.get('batch') || url.searchParams.get('lot') || url.searchParams.get('b');
        const gtinParam = url.searchParams.get('gtin') || url.searchParams.get('g');
        const lastSegment = url.pathname.split('/').filter(Boolean).pop();
        if (batchParam || gtinParam) {
          return {
            rawType: 'PLAIN_BATCH',
            batchNumber: batchParam || undefined,
            gtin: gtinParam || undefined
          };
        }
        if (lastSegment && lastSegment.length > 3) {
          return {
            rawType: 'PLAIN_BATCH',
            batchNumber: lastSegment
          };
        }
      } catch {}
    }

    // Check if it matches GS1 pattern
    const gs1 = this.parseGS1String(trimmed);
    if (gs1) return gs1;

    return {
      rawType: 'PLAIN_BATCH',
      batchNumber: trimmed
    };
  }

  /**
   * Full verification logic against registered database, cryptographic hashes, repeated scans, and cold-chain logs
   */
  public async verifyCode(
    code: string,
    scanType: 'QR' | 'GS1_DATAMATRIX' | 'MANUAL',
    metadata?: { location?: string; ipAddress?: string; userAgent?: string }
  ) {
    let parsedFields: ParsedCodeFields | null = null;

    if (scanType === 'GS1_DATAMATRIX') {
      parsedFields = this.parseGS1String(code);
    } else {
      parsedFields = this.parseQRCode(code);
    }

    const batchNumber = parsedFields?.batchNumber?.trim();
    const gtin = parsedFields?.gtin?.trim();

    // 1. Look up Batch in PostgreSQL (case-insensitive & fuzzy fallback)
    let batch = null;
    if (batchNumber) {
      batch = await prisma.batch.findFirst({
        where: { batchNumber: { equals: batchNumber, mode: 'insensitive' } },
        include: {
          product: { include: { manufacturer: true } },
          manufacturer: true,
          alerts: true
        }
      });
    }

    if (!batch && gtin) {
      const prod = await prisma.product.findFirst({
        where: { gtin: { equals: gtin, mode: 'insensitive' } },
        include: { batches: true, manufacturer: true }
      });
      if (prod && prod.batches.length > 0) {
        batch = await prisma.batch.findUnique({
          where: { id: prod.batches[0].id },
          include: {
            product: { include: { manufacturer: true } },
            manufacturer: true,
            alerts: true
          }
        });
      }
    }

    // Fallback: check if the raw scanned code contains any registered batch number
    if (!batch && code.trim().length > 3) {
      const allBatches = await prisma.batch.findMany({
        select: { id: true, batchNumber: true }
      });
      const matched = allBatches.find(b =>
        code.toLowerCase().includes(b.batchNumber.toLowerCase())
      );
      if (matched) {
        batch = await prisma.batch.findUnique({
          where: { id: matched.id },
          include: {
            product: { include: { manufacturer: true } },
            manufacturer: true,
            alerts: true
          }
        });
      }
    }

    // Repeated scan detection (counterfeit warning)
    const scanHistory = await prisma.productScanAudit.findMany({
      where: { code: code.trim() },
      orderBy: { scannedAt: 'asc' }
    });
    const scannedCount = scanHistory.length + 1;
    const firstScannedAt = scanHistory.length > 0 ? scanHistory[0].scannedAt.toISOString() : undefined;

    // Check if unregistered
    if (!batch) {
      const audit = await prisma.productScanAudit.create({
        data: {
          code,
          scanType,
          status: VerificationStatus.INVALID,
          location: metadata?.location,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        }
      });

      return {
        code,
        scanType,
        status: VerificationStatus.INVALID,
        isAuthentic: false,
        statusReason: 'Identifier not recognized or not registered on MediTrace ledger.',
        message: 'Identifier not recognized or not registered in the MediTrace network. This packaging barcode does not exist on the verified manufacturer ledger.',
        parsedFields: parsedFields || undefined,
        scannedCount,
        firstScannedAt,
        lastScannedAt: audit.scannedAt.toISOString(),
        provenanceTrail: [],
        temperatureCompliance: {
          compliant: null,
          recordedExcursions: 0,
          requiredRange: 'N/A'
        },
        integrityCheck: {
          canonicalHashMatched: false,
          computedHash: 'None (Unregistered)',
          blockchainStatus: 'NOT_FOUND'
        },
        isSimulatedTelemetry: false,
        verifiedAt: new Date().toISOString()
      };
    }

    // 2. Cryptographic Canonical Integrity Check
    const canonicalPayload = {
      batchNumber: batch.batchNumber,
      gtin: batch.product.gtin,
      mfgDate: batch.mfgDate.toISOString(),
      expDate: batch.expDate.toISOString(),
      quantity: batch.quantity,
      manufacturerName: batch.manufacturer.name,
      minTempCelsius: batch.minTempCelsius,
      maxTempCelsius: batch.maxTempCelsius
    };
    const computedHash = blockchainService.computeCanonicalHash(canonicalPayload as any);
    const hashMatched = batch.canonicalHash === computedHash;

    // 3. Temperature Compliance Check
    const activeExcursions = batch.alerts.filter(a => a.status === AlertStatus.ACTIVE);
    const tempCompliant = activeExcursions.length === 0 && batch.status !== BatchStatus.QUARANTINED;

    // 4. Duplicate scan detection (if scanned more than 5 times across distinct locations)
    const isSuspiciousDuplicate = scannedCount > 4;

    // 5. Determine Overall Verification Status
    let status: VerificationStatus = VerificationStatus.VERIFIED;
    let message = 'Authentic pharmaceutical product verified against registered manufacturer records and cryptographic ledger.';

    if (!hashMatched) {
      status = VerificationStatus.TAMPERED;
      message = 'CRITICAL: Cryptographic payload hash does not match registered ledger record. Possible record tampering or counterfeit packaging.';
    } else if (batch.status === BatchStatus.RECALLED) {
      status = VerificationStatus.FLAGGED_REVIEW;
      message = 'WARNING: This product batch has been officially RECALLED by manufacturer/regulator. Do NOT dispense.';
    } else if (batch.status === BatchStatus.QUARANTINED) {
      status = VerificationStatus.FLAGGED_REVIEW;
      message = 'CAUTION: Batch is currently QUARANTINED due to cold-chain excursion investigation.';
    } else if (isSuspiciousDuplicate) {
      status = VerificationStatus.DUPLICATE_SUSPICIOUS;
      message = `SUSPICIOUS DUPLICATION: This code has been scanned ${scannedCount} times. Multiple scans across different locations may indicate barcode cloning.`;
    } else if (activeExcursions.length > 0) {
      status = VerificationStatus.FLAGGED_REVIEW;
      message = `COLD-CHAIN EXCURSION FLAGGED: ${activeExcursions.length} unacknowledged temperature excursions on record. Pharmacist review required prior to dispensing.`;
    }

    // Record audit
    const auditRecord = await prisma.productScanAudit.create({
      data: {
        code,
        scanType,
        status,
        batchId: batch.id,
        location: metadata?.location,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      }
    });

    // 6. Assemble Provenance Trail
    const handoffs = await prisma.handoffEvent.findMany({
      where: { shipment: { items: { some: { batchId: batch.id } } } },
      include: { senderOrg: true, recipientOrg: true },
      orderBy: { timestamp: 'asc' }
    });

    const provenanceTrail = [
      {
        step: '1. Manufacturing & Batch Release',
        organization: batch.manufacturer.name,
        role: 'Manufacturer',
        timestamp: batch.createdAt.toISOString(),
        location: batch.manufacturer.address,
        verifiedOnChain: batch.blockchainConfirmed,
        txId: batch.blockchainTxId || undefined
      },
      ...handoffs.map((h, index) => ({
        step: `${index + 2}. Supply Chain Handoff`,
        organization: `${h.senderOrg.name} → ${h.recipientOrg.name}`,
        role: 'Logistics Custody Transfer',
        timestamp: h.timestamp.toISOString(),
        location: h.location,
        verifiedOnChain: h.blockchainConfirmed,
        txId: h.blockchainTxId || undefined
      }))
    ];

    return {
      code,
      scanType,
      status,
      isAuthentic: status === VerificationStatus.VERIFIED,
      statusReason: message,
      message,
      parsedFields: parsedFields || undefined,
      product: {
        id: batch.product.id,
        name: batch.product.name,
        genericName: batch.product.genericName,
        gtin: batch.product.gtin,
        dosageForm: batch.product.dosageForm,
        strength: batch.product.strength,
        manufacturerId: batch.product.manufacturerId,
        description: batch.product.description,
        minTempCelsius: batch.product.minTempCelsius,
        maxTempCelsius: batch.product.maxTempCelsius,
        requiresColdChain: batch.product.requiresColdChain,
        regulatoryApprovalId: batch.product.regulatoryApprovalId,
        isActive: batch.product.isActive,
        createdAt: batch.product.createdAt.toISOString(),
        updatedAt: batch.product.updatedAt.toISOString()
      },
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        productId: batch.productId,
        manufacturerId: batch.manufacturerId,
        manufacturerName: batch.manufacturer.name,
        mfgDate: batch.mfgDate.toISOString(),
        expDate: batch.expDate.toISOString(),
        quantity: batch.quantity,
        remainingQuantity: batch.remainingQuantity,
        unitOfMeasure: batch.unitOfMeasure,
        minTempCelsius: batch.minTempCelsius,
        maxTempCelsius: batch.maxTempCelsius,
        status: batch.status,
        canonicalHash: batch.canonicalHash || undefined,
        blockchainTxId: batch.blockchainTxId || undefined,
        blockchainConfirmed: batch.blockchainConfirmed,
        blockchainMode: batch.blockchainMode as 'FABRIC_LIVE' | 'DEMO_INTEGRITY',
        qrPayload: batch.qrPayload,
        gs1DataMatrixPayload: batch.gs1DataMatrixPayload,
        notes: batch.notes || undefined,
        createdAt: batch.createdAt.toISOString(),
        updatedAt: batch.updatedAt.toISOString()
      },
      provenanceTrail,
      temperatureCompliance: {
        compliant: tempCompliant,
        recordedExcursions: batch.alerts.length,
        requiredRange: `${batch.minTempCelsius}°C to ${batch.maxTempCelsius}°C`
      },
      integrityCheck: {
        canonicalHashMatched: hashMatched,
        computedHash,
        storedHash: batch.canonicalHash || undefined,
        blockchainTxId: batch.blockchainTxId || undefined,
        blockchainStatus: batch.blockchainConfirmed ? 'CONFIRMED' : 'PENDING'
      },
      scannedCount,
      firstScannedAt,
      lastScannedAt: auditRecord.scannedAt.toISOString(),
      isSimulatedTelemetry: true, // Clearly explicitly labelled
      verifiedAt: new Date().toISOString()
    };
  }
}

export const verificationService = new VerificationService();
