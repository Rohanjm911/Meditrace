import { describe, it, expect } from 'vitest';
import { verificationService } from '../src/services/verificationService.js';
import { blockchainService } from '../src/services/blockchainService.js';

describe('Verification & Data Integrity Unit Tests', () => {
  it('correctly parses standard GS1 DataMatrix bracket syntax', () => {
    const raw = '(01)00300010023456(17)261010(10)VAC-2026-089A(21)SN10098421';
    const parsed = verificationService.parseGS1String(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.gtin).toBe('00300010023456');
    expect(parsed?.batchNumber).toBe('VAC-2026-089A');
    expect(parsed?.serialNumber).toBe('SN10098421');
    expect(parsed?.expiryDate).toBe('2026-10-10');
  });

  it('correctly parses JSON QR Code payloads', () => {
    const jsonStr = JSON.stringify({
      app: 'MEDITRACE',
      batch: 'VAC-2026-089A',
      gtin: '00300010023456',
      exp: '2026-10-10'
    });
    const parsed = verificationService.parseQRCode(jsonStr);

    expect(parsed.rawType).toBe('QR_JSON');
    expect(parsed.batchNumber).toBe('VAC-2026-089A');
    expect(parsed.gtin).toBe('00300010023456');
  });

  it('computes deterministic canonical SHA-256 hashes irrespective of key insertion order', () => {
    const objA = {
      batchNumber: 'B100',
      gtin: '00123456789012',
      quantity: 500
    };
    const objB = {
      quantity: 500,
      batchNumber: 'B100',
      gtin: '00123456789012'
    };

    const hashA = blockchainService.computeCanonicalHash(objA);
    const hashB = blockchainService.computeCanonicalHash(objB);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
  });
});
