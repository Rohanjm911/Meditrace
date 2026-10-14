/**
 * MediTrace Database Seeder
 * Creates dedicated datasets for all 5 enterprise roles and organizations:
 * 1. Administrator (MediTrace National Regulatory Authority)
 * 2. Manufacturer (Pfizer Bio-Pharma Labs India)
 * 3. Distributor (MedExpress Cold-Chain Logistics)
 * 4. Warehouse (Nordic Central Vaccine Depot)
 * 5. Pharmacist (Apollo Central Healthcare Pharmacy)
 */
import {
  PrismaClient,
  UserRole,
  OrganizationType,
  BatchStatus,
  ShipmentStatus,
  HandoffStatus,
  AlertSeverity,
  AlertStatus,
  VerificationStatus
} from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function computeCanonicalHash(payload) {
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj = {};
  for (const k of sortedKeys) {
    sortedObj[k] = payload[k];
  }
  return crypto.createHash('sha256').update(JSON.stringify(sortedObj)).digest('hex');
}

async function seed() {
  console.log('====================================================');
  console.log('--- Starting MediTrace Multi-Tenant Database Seeding ---');
  console.log('====================================================');

  // Clean up existing records in proper dependency order
  console.log('[Seed] Cleaning up existing records...');
  await prisma.auditLog.deleteMany({});
  await prisma.productScanAudit.deleteMany({});
  await prisma.temperatureAlert.deleteMany({});
  await prisma.sensorReading.deleteMany({});
  await prisma.handoffEvent.deleteMany({});
  await prisma.shipmentItem.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.sensor.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.blockchainTransaction.deleteMany({});

  // 1. Create the 5 Organizations
  console.log('[Seed] Creating 5 Distinct Supply-Chain Organizations...');
  const orgRegulator = await prisma.organization.create({
    data: {
      name: 'MediTrace National Regulatory Authority',
      type: OrganizationType.REGULATOR,
      licenseNumber: 'REG-FDA-2026-001',
      address: 'Central Health Directorate, Block A, New Delhi',
      contactEmail: 'compliance@meditrace.gov.in',
      contactPhone: '+91-11-2309-8800'
    }
  });

  const orgMfg = await prisma.organization.create({
    data: {
      name: 'Pfizer Bio-Pharma Labs India',
      type: OrganizationType.MANUFACTURER,
      licenseNumber: 'MFG-MH-2024-8901',
      address: 'Plot 42, Hinjewadi Biotech Park, Pune, Maharashtra',
      contactEmail: 'supply@pfizer-demo.com',
      contactPhone: '+91-20-4100-2200'
    }
  });

  const orgDist = await prisma.organization.create({
    data: {
      name: 'MedExpress Cold-Chain Logistics',
      type: OrganizationType.DISTRIBUTOR,
      licenseNumber: 'DIST-KA-2025-4512',
      address: 'Cargo Complex 4, Bengaluru International Logistics Hub, Karnataka',
      contactEmail: 'operations@medexpress.com',
      contactPhone: '+91-80-6700-1122'
    }
  });

  const orgWh = await prisma.organization.create({
    data: {
      name: 'Nordic Central Vaccine Depot',
      type: OrganizationType.WAREHOUSE,
      licenseNumber: 'WH-KA-2025-7823',
      address: 'Cold Storage Terminal 2, Electronic City, Bengaluru, Karnataka',
      contactEmail: 'depot@nordic-hub.com',
      contactPhone: '+91-80-2852-9900'
    }
  });

  const orgPharm = await prisma.organization.create({
    data: {
      name: 'Apollo Central Healthcare Pharmacy',
      type: OrganizationType.PHARMACY,
      licenseNumber: 'PHARM-DL-2024-1189',
      address: 'Connaught Place Retail Wing, New Delhi',
      contactEmail: 'central@apollo-central.com',
      contactPhone: '+91-11-4350-5555'
    }
  });

  // 2. Create the 5 Users
  console.log('[Seed] Creating 5 Authenticated Demo Officers...');
  const passAdmin = await argon2.hash('Admin@123456');
  const passMfg = await argon2.hash('Mfg@123456');
  const passDist = await argon2.hash('Dist@123456');
  const passWh = await argon2.hash('Wh@123456');
  const passPharm = await argon2.hash('Pharm@123456');

  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@meditrace.internal',
      passwordHash: passAdmin,
      fullName: 'Dr. Evelyn Reed (Director of Compliance)',
      role: UserRole.ADMIN,
      organizationId: orgRegulator.id
    }
  });

  const userMfg = await prisma.user.create({
    data: {
      email: 'manufacturer@pfizer-demo.com',
      passwordHash: passMfg,
      fullName: 'Marcus Vance (Chief Manufacturing Officer)',
      role: UserRole.MANUFACTURER,
      organizationId: orgMfg.id
    }
  });

  const userDist = await prisma.user.create({
    data: {
      email: 'distributor@medexpress.com',
      passwordHash: passDist,
      fullName: 'Siddharth Roy (Logistics Dispatch Director)',
      role: UserRole.DISTRIBUTOR,
      organizationId: orgDist.id
    }
  });

  const userWh = await prisma.user.create({
    data: {
      email: 'warehouse@nordic-hub.com',
      passwordHash: passWh,
      fullName: 'Vikram Joshi (Cold Hub Superintendent)',
      role: UserRole.WAREHOUSE_OPERATOR,
      organizationId: orgWh.id
    }
  });

  const userPharm = await prisma.user.create({
    data: {
      email: 'pharmacist@apollo-central.com',
      passwordHash: passPharm,
      fullName: 'Priya Sharma, PharmD (Head Pharmacist)',
      role: UserRole.PHARMACIST,
      organizationId: orgPharm.id
    }
  });

  // 3. Create Pharmaceutical Products
  console.log('[Seed] Creating Products Catalogue...');
  const prodComirnaty = await prisma.product.create({
    data: {
      name: 'Comirnaty COVID-19 mRNA Vaccine',
      genericName: 'Tozinameran (mRNA COVID-19)',
      gtin: '00300010023456',
      dosageForm: 'Suspension for Injection',
      strength: '0.3 mL / dose',
      manufacturerId: orgMfg.id,
      description: 'Ultra-low temperature mRNA vaccine requiring strict -90°C to -60°C thermal storage until dilution.',
      minTempCelsius: -90.0,
      maxTempCelsius: -60.0,
      requiresColdChain: true,
      regulatoryApprovalId: 'FDA-BLA-125742'
    }
  });

  const prodVax = await prisma.product.create({
    data: {
      name: 'Vaxzevria ChAdOx1 Vaccine',
      genericName: 'COVID-19 Vaccine (ChAdOx1-S [recombinant])',
      gtin: '00300010034567',
      dosageForm: 'Sterile Injection',
      strength: '5 mL (10 doses)',
      manufacturerId: orgMfg.id,
      description: 'Standard cold-chain refrigerated recombinant viral vector vaccine requiring 2°C to 8°C.',
      minTempCelsius: 2.0,
      maxTempCelsius: 8.0,
      requiresColdChain: true,
      regulatoryApprovalId: 'EMA-MAA-005621'
    }
  });

  const prodAmox = await prisma.product.create({
    data: {
      name: 'Amoxicillin Trihydrate 500mg',
      genericName: 'Amoxicillin',
      gtin: '00300010045678',
      dosageForm: 'Capsule, Hard',
      strength: '500 mg',
      manufacturerId: orgMfg.id,
      description: 'Broad-spectrum beta-lactam antibacterial for bacterial infections. Controlled room temperature.',
      minTempCelsius: 15.0,
      maxTempCelsius: 25.0,
      requiresColdChain: false,
      regulatoryApprovalId: 'CDSCO-DCG-98441'
    }
  });

  const prodRotarix = await prisma.product.create({
    data: {
      name: 'Rotarix Live Attenuated Rotavirus',
      genericName: 'Human Rotavirus Strain RIX4414',
      gtin: '00300010056789',
      dosageForm: 'Oral Suspension',
      strength: '1.5 mL Oral Applicator',
      manufacturerId: orgMfg.id,
      description: 'Oral rotavirus pediatric vaccine requiring continuous refrigerated protection 2°C to 8°C.',
      minTempCelsius: 2.0,
      maxTempCelsius: 8.0,
      requiresColdChain: true,
      regulatoryApprovalId: 'WHO-PQ-2021-098'
    }
  });

  const prodInsulin = await prisma.product.create({
    data: {
      name: 'Humalog Rapid-Acting Insulin Lispro',
      genericName: 'Insulin Lispro (rDNA origin)',
      gtin: '00300010067890',
      dosageForm: 'Subcutaneous Solution Cartridge',
      strength: '100 U/mL (3 mL)',
      manufacturerId: orgMfg.id,
      description: 'Rapid-acting human insulin analog for glycemic control in diabetes mellitus. Keep refrigerated 2°C to 8°C.',
      minTempCelsius: 2.0,
      maxTempCelsius: 8.0,
      requiresColdChain: true,
      regulatoryApprovalId: 'CDSCO-BIO-2023-771'
    }
  });

  const prodLipitor = await prisma.product.create({
    data: {
      name: 'Lipitor Atorvastatin Calcium 20mg',
      genericName: 'Atorvastatin Calcium',
      gtin: '00300010078901',
      dosageForm: 'Film-Coated Tablet',
      strength: '20 mg',
      manufacturerId: orgMfg.id,
      description: 'Lipid-lowering HMG-CoA reductase inhibitor for cardiovascular risk reduction. Controlled storage 15°C to 30°C.',
      minTempCelsius: 15.0,
      maxTempCelsius: 30.0,
      requiresColdChain: false,
      regulatoryApprovalId: 'FDA-NDA-020702'
    }
  });

  // 4. Create Batches with Canonical Hashes across lifecycle
  console.log('[Seed] Creating 8 Serialized Batches with Cryptographic Hashes...');
  const now = new Date();
  const mfgPast30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const mfgPast15 = new Date(now.getTime() - 15 * 24 * 3600 * 1000);
  const mfgPast5 = new Date(now.getTime() - 5 * 24 * 3600 * 1000);
  const expFuture12 = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const expFuture24 = new Date(now.getTime() + 730 * 24 * 3600 * 1000);

  // Helper to generate batch record
  async function createBatchRecord(batchNumber, product, mfgDate, expDate, quantity, remainingQuantity, unit, status, minT, maxT, serialPrefix, notes) {
    const hash = computeCanonicalHash({
      batchNumber,
      gtin: product.gtin,
      mfgDate: mfgDate.toISOString(),
      expDate: expDate.toISOString(),
      quantity,
      manufacturerName: orgMfg.name,
      minTempCelsius: minT,
      maxTempCelsius: maxT
    });
    const tx = `0x${crypto.randomBytes(32).toString('hex')}`;
    const qrPayload = JSON.stringify({
      app: 'MEDITRACE',
      batch: batchNumber,
      gtin: product.gtin,
      exp: expDate.toISOString().slice(0, 10),
      hash,
      tx
    });
    const gs1 = `(01)${product.gtin}(17)${expDate.toISOString().slice(2, 4)}${expDate.toISOString().slice(5, 7)}${expDate.toISOString().slice(8, 10)}(10)${batchNumber}(21)${serialPrefix}`;

    return await prisma.batch.create({
      data: {
        batchNumber,
        productId: product.id,
        manufacturerId: orgMfg.id,
        mfgDate,
        expDate,
        quantity,
        remainingQuantity,
        unitOfMeasure: unit,
        minTempCelsius: minT,
        maxTempCelsius: maxT,
        status,
        canonicalHash: hash,
        blockchainTxId: tx,
        blockchainConfirmed: true,
        blockchainMode: 'DEMO_INTEGRITY',
        qrPayload,
        gs1DataMatrixPayload: gs1,
        notes
      }
    });
  }

  // 1. Manufacturer Vault Batch (Pfizer internal vault)
  const batch1 = await createBatchRecord(
    'VAC-2026-089A',
    prodComirnaty,
    mfgPast30,
    expFuture12,
    5000,
    5000,
    'vials',
    BatchStatus.REGISTERED,
    -90.0,
    -60.0,
    'SN10098421',
    'Pfizer Pune Vault A ultra-cold lot. Certified under ISO-13485 cleanroom validation.'
  );

  // 2. Manufacturer Fresh Packaging Batch (Amoxicillin)
  const batch2 = await createBatchRecord(
    'AMX-2026-771C',
    prodAmox,
    mfgPast5,
    expFuture24,
    25000,
    25000,
    'capsules',
    BatchStatus.REGISTERED,
    15.0,
    25.0,
    'SN10098771',
    'Controlled room temperature batch in packaging bay. Ready for wholesale allocation.'
  );

  // 3. Manufacturer Approved Batch (Lipitor)
  const batch3 = await createBatchRecord(
    'LIP-2026-302F',
    prodLipitor,
    mfgPast15,
    expFuture24,
    50000,
    50000,
    'tablets',
    BatchStatus.REGISTERED,
    15.0,
    30.0,
    'SN10098302',
    'Solid oral dosage form release approved by Pfizer Quality Assurance Directorate.'
  );

  // 4. In-Transit Fleet Consignment (MedExpress Reefer)
  const batch4 = await createBatchRecord(
    'VAX-2026-104B',
    prodVax,
    mfgPast30,
    expFuture12,
    12000,
    12000,
    'vials',
    BatchStatus.IN_TRANSIT,
    2.0,
    8.0,
    'SN20489912',
    'Dispatched in active reefer container with dual IoT temperature probes.'
  );

  // 5. Warehouse Quarantined Batch (Nordic Depot Bay 3 with excursion)
  const batch5 = await createBatchRecord(
    'ROT-2026-441D',
    prodRotarix,
    mfgPast30,
    expFuture12,
    3500,
    3500,
    'applicators',
    BatchStatus.QUARANTINED,
    2.0,
    8.0,
    'SN30981245',
    'Cold hub bay 3 storage. Active temperature excursion alert triggered; lot placed in quarantine.'
  );

  // 6. Warehouse Stored Cryo Batch (Nordic Depot Bay 1)
  const batch6 = await createBatchRecord(
    'VAC-2026-042B',
    prodComirnaty,
    mfgPast15,
    expFuture12,
    2500,
    2500,
    'vials',
    BatchStatus.STORED,
    -90.0,
    -60.0,
    'SN10098042',
    'Stored in Nordic Central Depot Bay 1 ULT Freezer (-78.2°C). Certified intake.'
  );

  // 7. Pharmacy Bound Insulin Batch (Arrived / Pending acceptance at Apollo)
  const batch7 = await createBatchRecord(
    'INS-2026-550E',
    prodInsulin,
    mfgPast15,
    expFuture12,
    1200,
    1200,
    'cartridges',
    BatchStatus.STORED,
    2.0,
    8.0,
    'SN40550123',
    'Cold staging transport for Apollo Central Pharmacy dispensary refrigerator.'
  );

  // 8. Pharmacy Delivered Amoxicillin (Dispensed at Apollo counter)
  const batch8 = await createBatchRecord(
    'AMX-2026-610D',
    prodAmox,
    mfgPast30,
    expFuture24,
    8000,
    7200,
    'capsules',
    BatchStatus.DELIVERED,
    15.0,
    25.0,
    'SN10098610',
    'Delivered and stocked at Apollo Central Pharmacy. Active retail prescription dispensing.'
  );

  // 5. Create IoT Sensors across all 5 facilities
  console.log('[Seed] Creating 5 IoT Telemetry Sensors for facilities and fleet...');
  const sensor1 = await prisma.sensor.create({
    data: {
      serialNumber: 'SNS-COLD-001',
      name: 'CryoLogger ULT Sensor Probe #1',
      location: 'Pune MFG Cold Storage Vault A (Pfizer)',
      type: 'ULT_CRYOGENIC',
      batteryLevel: 98.5,
      isActive: true,
      isSimulated: true,
      lastReadingAt: now
    }
  });

  const sensor2 = await prisma.sensor.create({
    data: {
      serialNumber: 'SNS-COLD-002',
      name: 'Reefer Tracker Fleet Unit #42',
      location: 'MedExpress Reefer Vehicle KA-01-EXP-99 (NH-48 Corridor)',
      type: 'REFRIGERATED_GPS',
      batteryLevel: 89.0,
      isActive: true,
      isSimulated: true,
      lastReadingAt: now
    }
  });

  const sensor3 = await prisma.sensor.create({
    data: {
      serialNumber: 'SNS-COLD-003',
      name: 'Hub Bay 3 Sensor Telemetry Pod',
      location: 'Nordic Central Vaccine Depot - Bay 3 Cold Locker',
      type: 'STATIONARY_COLD_DEPOT',
      batteryLevel: 95.0,
      isActive: true,
      isSimulated: true,
      lastReadingAt: now
    }
  });

  const sensor4 = await prisma.sensor.create({
    data: {
      serialNumber: 'SNS-WH-BAY01',
      name: 'Depot Bay 1 Cryo Chamber Monitor',
      location: 'Nordic Central Vaccine Depot - Bay 1 ULT Vault',
      type: 'ULT_CRYOGENIC',
      batteryLevel: 97.0,
      isActive: true,
      isSimulated: true,
      lastReadingAt: now
    }
  });

  const sensor5 = await prisma.sensor.create({
    data: {
      serialNumber: 'SNS-PHARM-FRG01',
      name: 'Apollo Dispensary Cold Storage Probe',
      location: 'Apollo Central Healthcare Pharmacy - Dispensary Fridge #1',
      type: 'DISPENSARY_COLD_UNIT',
      batteryLevel: 99.0,
      isActive: true,
      isSimulated: true,
      lastReadingAt: now
    }
  });

  const sensor6 = await prisma.sensor.create({
    data: {
      serialNumber: 'SNS-LOG-004',
      name: 'Express Cold Van Fleet Unit #18',
      location: 'MedExpress Van DL-04-CLD-12 (Delhi NCR Route)',
      type: 'REFRIGERATED_GPS',
      batteryLevel: 92.0,
      isActive: true,
      isSimulated: true,
      lastReadingAt: now
    }
  });

  // 6. Create Shipments and Handoffs connecting the supply chain
  console.log('[Seed] Creating Multi-Party Supply Chain Shipments & Custody Handoffs...');

  // Shipment 1: Pfizer -> MedExpress (Completed transfer)
  const shipment1 = await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-MT-90214',
      senderOrgId: orgMfg.id,
      recipientOrgId: orgDist.id,
      assignedCarrier: 'ColdShield Express Transport',
      status: ShipmentStatus.ACCEPTED,
      originLocation: 'Pfizer Bio-Pharma Labs, Pune Dock Bay 2',
      destinationLocation: 'MedExpress Logistics Hub, Bengaluru',
      sensorId: sensor2.id,
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      dispatchTime: new Date(now.getTime() - 24 * 3600 * 1000),
      deliveryTime: new Date(now.getTime() - 12 * 3600 * 1000),
      items: {
        create: [
          { batchId: batch4.id, quantity: 6000 }
        ]
      }
    }
  });

  await prisma.handoffEvent.create({
    data: {
      shipmentId: shipment1.id,
      senderOrgId: orgMfg.id,
      senderUserId: userMfg.id,
      recipientOrgId: orgDist.id,
      recipientUserId: userDist.id,
      status: HandoffStatus.ACCEPTED,
      location: 'Pune Loading Dock Bay 2',
      notes: '6,000 vials of Vaxzevria transferred into refrigerated truck KA-01-EXP-99 at 4.2°C.',
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      timestamp: new Date(now.getTime() - 12 * 3600 * 1000)
    }
  });

  // Shipment 2: MedExpress -> Nordic Central Vaccine Depot (In Transit, PENDING handoff for Warehouse!)
  const shipment2 = await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-MX-88301',
      senderOrgId: orgDist.id,
      recipientOrgId: orgWh.id,
      assignedCarrier: 'MedExpress Cold Fleet Fleet #42',
      status: ShipmentStatus.IN_TRANSIT,
      originLocation: 'MedExpress Logistics Terminal, Bengaluru',
      destinationLocation: 'Nordic Central Vaccine Depot, Receiving Dock 1',
      sensorId: sensor2.id,
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      dispatchTime: new Date(now.getTime() - 4 * 3600 * 1000),
      items: {
        create: [
          { batchId: batch5.id, quantity: 3500 },
          { batchId: batch6.id, quantity: 2500 }
        ]
      }
    }
  });

  // Handoff 2: PENDING at Nordic Depot (Warehouse operator can click Accept!)
  await prisma.handoffEvent.create({
    data: {
      shipmentId: shipment2.id,
      senderOrgId: orgDist.id,
      senderUserId: userDist.id,
      recipientOrgId: orgWh.id,
      status: HandoffStatus.PENDING,
      location: 'Nordic Central Depot Receiving Dock 1',
      notes: 'Consignment arrived at Depot Bay 1/3. Digital seal verified. Temperature log submitted for operator sign-off.',
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      timestamp: new Date(now.getTime() - 30 * 60 * 1000)
    }
  });

  // Shipment 3: Nordic Depot -> Apollo Central Pharmacy (In Transit, PENDING handoff for Pharmacist!)
  const shipment3 = await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-WH-77210',
      senderOrgId: orgWh.id,
      recipientOrgId: orgPharm.id,
      assignedCarrier: 'Nordic Regional Reefer Express',
      status: ShipmentStatus.IN_TRANSIT,
      originLocation: 'Nordic Cold Storage Terminal 2, Bengaluru',
      destinationLocation: 'Apollo Central Healthcare Pharmacy Dispensary Wing',
      sensorId: sensor3.id,
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      dispatchTime: new Date(now.getTime() - 3 * 3600 * 1000),
      items: {
        create: [
          { batchId: batch7.id, quantity: 1200 }
        ]
      }
    }
  });

  // Handoff 3: PENDING at Apollo Pharmacy (Pharmacist can click Accept!)
  await prisma.handoffEvent.create({
    data: {
      shipmentId: shipment3.id,
      senderOrgId: orgWh.id,
      senderUserId: userWh.id,
      recipientOrgId: orgPharm.id,
      status: HandoffStatus.PENDING,
      location: 'Apollo Central Pharmacy Receiving Counter, New Delhi',
      notes: '1,200 Insulin cartridges delivered under continuous 2-8°C thermal wrap. Pending Pharmacist verification.',
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      timestamp: new Date(now.getTime() - 15 * 60 * 1000)
    }
  });

  // Shipment 4: MedExpress -> Apollo Central Pharmacy (Delivered & Accepted Amoxicillin)
  const shipment4 = await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-MX-88492',
      senderOrgId: orgDist.id,
      recipientOrgId: orgPharm.id,
      assignedCarrier: 'MedExpress City Cargo Van DL-04',
      status: ShipmentStatus.ACCEPTED,
      originLocation: 'MedExpress Cargo Terminal, New Delhi',
      destinationLocation: 'Apollo Central Healthcare Pharmacy, New Delhi',
      sensorId: sensor6.id,
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      dispatchTime: new Date(now.getTime() - 18 * 3600 * 1000),
      deliveryTime: new Date(now.getTime() - 6 * 3600 * 1000),
      items: {
        create: [
          { batchId: batch8.id, quantity: 8000 }
        ]
      }
    }
  });

  await prisma.handoffEvent.create({
    data: {
      shipmentId: shipment4.id,
      senderOrgId: orgDist.id,
      senderUserId: userDist.id,
      recipientOrgId: orgPharm.id,
      recipientUserId: userPharm.id,
      status: HandoffStatus.ACCEPTED,
      location: 'Apollo Central Pharmacy Dispensary Wing',
      notes: '8,000 capsules of Amoxicillin 500mg received and logged into active pharmacy prescription dispensing shelves.',
      blockchainTxId: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainConfirmed: true,
      timestamp: new Date(now.getTime() - 6 * 3600 * 1000)
    }
  });

  // 7. Generate Time-Series Sensor Readings
  console.log('[Seed] Generating Time-Series Sensor Telemetry Readings...');
  const readings = [];

  // Sensor 1: Pune MFG Vault A (-75.2°C, safe ULT)
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60 * 1000);
    const temp = +(-75.2 + Math.sin(i / 3) * 0.4).toFixed(2);
    readings.push({
      sensorId: sensor1.id,
      batchId: batch1.id,
      temperatureCelsius: temp,
      humidityPercent: 12.0,
      isSimulated: true,
      isExcursion: false,
      batteryLevel: 98.5,
      location: 'Pune MFG Vault A (Pfizer)',
      timestamp: t
    });
  }

  // Sensor 2: Reefer Tracker Fleet #42 (4.4°C, compliant)
  for (let i = 25; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 10 * 60 * 1000);
    const temp = +(4.2 + Math.sin(i / 2) * 0.6).toFixed(2);
    readings.push({
      sensorId: sensor2.id,
      batchId: batch4.id,
      shipmentId: shipment2.id,
      temperatureCelsius: temp,
      humidityPercent: 54.0,
      isSimulated: true,
      isExcursion: false,
      batteryLevel: +(89.0 - (25 - i) * 0.04).toFixed(1),
      location: 'National Highway 48, Hubballi Sector',
      timestamp: t
    });
  }

  // Sensor 3: Nordic Hub Bay 3 (Rotarix with active temperature excursion spike)
  for (let i = 30; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 10 * 60 * 1000);
    let temp = 4.8;
    let isExcursion = false;
    if (i <= 10) {
      temp = +(8.8 + (10 - i) * 0.2).toFixed(2); // Spikes up to 10.8°C
      isExcursion = true;
    }
    readings.push({
      sensorId: sensor3.id,
      batchId: batch5.id,
      temperatureCelsius: temp,
      humidityPercent: 63.0,
      isSimulated: true,
      isExcursion,
      batteryLevel: 95.0,
      location: 'Nordic Central Depot - Bay 3 Cold Locker',
      timestamp: t
    });
  }

  // Sensor 4: Nordic Bay 1 Cryo Chamber (-78.2°C)
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60 * 1000);
    const temp = +(-78.2 + Math.sin(i / 4) * 0.3).toFixed(2);
    readings.push({
      sensorId: sensor4.id,
      batchId: batch6.id,
      temperatureCelsius: temp,
      humidityPercent: 15.0,
      isSimulated: true,
      isExcursion: false,
      batteryLevel: 97.0,
      location: 'Nordic Central Vaccine Depot - Bay 1 ULT Vault',
      timestamp: t
    });
  }

  // Sensor 5: Apollo Dispensary Under-Counter Fridge (3.4°C)
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60 * 1000);
    const temp = +(3.4 + Math.sin(i / 3) * 0.4).toFixed(2);
    readings.push({
      sensorId: sensor5.id,
      batchId: batch7.id,
      temperatureCelsius: temp,
      humidityPercent: 48.0,
      isSimulated: true,
      isExcursion: false,
      batteryLevel: 99.0,
      location: 'Apollo Central Healthcare Pharmacy - Dispensary Fridge #1',
      timestamp: t
    });
  }

  await prisma.sensorReading.createMany({ data: readings });

  // 8. Create Realistic Alerts for various stages
  console.log('[Seed] Creating Temperature Alerts...');

  // Active Critical Alert: Nordic Hub Bay 3 (Rotarix)
  await prisma.temperatureAlert.create({
    data: {
      sensorId: sensor3.id,
      batchId: batch5.id,
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.ACTIVE,
      readingCelsius: 10.8,
      minThresholdCelsius: 2.0,
      maxThresholdCelsius: 8.0,
      durationMinutes: 50,
      message: 'Temperature excursion detected at Nordic Hub Bay 3 (10.8°C exceeds max permitted 8.0°C). Batch placed under quarantine review.',
      isSimulated: true
    }
  });

  // Resolved Alert: MedExpress Reefer drift during checkpost
  await prisma.temperatureAlert.create({
    data: {
      sensorId: sensor2.id,
      batchId: batch4.id,
      shipmentId: shipment1.id,
      severity: AlertSeverity.MEDIUM,
      status: AlertStatus.RESOLVED,
      readingCelsius: 8.4,
      minThresholdCelsius: 2.0,
      maxThresholdCelsius: 8.0,
      durationMinutes: 12,
      message: 'Brief temperature drift during reefer door opening at checkpost (8.4°C). Re-stabilized to 4.2°C within 12 minutes.',
      isSimulated: true,
      acknowledgedByUserId: userDist.id,
      acknowledgedAt: new Date(now.getTime() - 6 * 3600 * 1000),
      resolutionNotes: 'Driver confirmed momentary refrigeration door opening during routine transit inspection. Temperature restored promptly.'
    }
  });

  // Resolved Alert: Apollo Dispensary fridge brief restocking rise
  await prisma.temperatureAlert.create({
    data: {
      sensorId: sensor5.id,
      batchId: batch7.id,
      shipmentId: shipment3.id,
      severity: AlertSeverity.LOW,
      status: AlertStatus.RESOLVED,
      readingCelsius: 7.9,
      minThresholdCelsius: 2.0,
      maxThresholdCelsius: 8.0,
      durationMinutes: 8,
      message: 'Minor thermal variance during dispensary inventory loading (7.9°C). Re-stabilized to 3.4°C.',
      isSimulated: true,
      acknowledgedByUserId: userPharm.id,
      acknowledgedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      resolutionNotes: 'Door open for 4 minutes during stocking of new insulin consignment. Thermal mass recovered quickly.'
    }
  });

  // 9. Create Product Scan Audits
  console.log('[Seed] Recording Product Scan Audits...');
  await prisma.productScanAudit.createMany({
    data: [
      {
        code: 'VAC-2026-089A',
        scanType: 'QR',
        status: VerificationStatus.VERIFIED,
        location: 'Pfizer Bio-Pharma QA Release Gate, Pune',
        batchId: batch1.id,
        scannedAt: new Date(now.getTime() - 24 * 3600 * 1000)
      },
      {
        code: 'AMX-2026-610D',
        scanType: 'GS1_DATAMATRIX',
        status: VerificationStatus.VERIFIED,
        location: 'Apollo Central Pharmacy Dispensary Counter #1',
        batchId: batch8.id,
        scannedAt: new Date(now.getTime() - 4 * 3600 * 1000)
      },
      {
        code: 'INS-2026-550E',
        scanType: 'GS1_DATAMATRIX',
        status: VerificationStatus.VERIFIED,
        location: 'Apollo Central Pharmacy Counter #2 (Patient Dispense RX-9041)',
        batchId: batch7.id,
        scannedAt: new Date(now.getTime() - 1 * 3600 * 1000)
      },
      {
        code: 'ROT-2026-441D',
        scanType: 'QR',
        status: VerificationStatus.FLAGGED_REVIEW,
        location: 'Nordic Central Vaccine Depot Inbound Quality Dock',
        batchId: batch5.id,
        scannedAt: new Date(now.getTime() - 45 * 60 * 1000)
      },
      {
        code: 'SUSP-TAMPER-991',
        scanType: 'MANUAL',
        status: VerificationStatus.INVALID,
        location: 'Delhi Regional Hospital Triage Counter',
        scannedAt: new Date(now.getTime() - 30 * 60 * 1000)
      }
    ]
  });

  // 10. Create Audit Trail Logs for all 5 roles
  console.log('[Seed] Recording Audit Trail Logs across all 5 Organizations...');
  await prisma.auditLog.createMany({
    data: [
      // Regulatory Authority
      {
        userId: userAdmin.id,
        userName: userAdmin.fullName,
        userRole: userAdmin.role,
        organizationName: orgRegulator.name,
        action: 'POLICY_VALIDATION',
        resourceType: 'REGULATION',
        resourceId: orgRegulator.id,
        details: { standard: 'WHO TRS 961 Annex 5', validationStatus: 'ACTIVE', notes: 'National cold chain governance policy enforced.' },
        timestamp: new Date(now.getTime() - 48 * 3600 * 1000)
      },
      // Manufacturer
      {
        userId: userMfg.id,
        userName: userMfg.fullName,
        userRole: userMfg.role,
        organizationName: orgMfg.name,
        action: 'BATCH_REGISTRATION',
        resourceType: 'BATCH',
        resourceId: batch1.id,
        details: { batchNumber: batch1.batchNumber, gtin: prodComirnaty.gtin, hash: batch1.canonicalHash },
        timestamp: new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      },
      {
        userId: userMfg.id,
        userName: userMfg.fullName,
        userRole: userMfg.role,
        organizationName: orgMfg.name,
        action: 'SHIPMENT_DISPATCH',
        resourceType: 'SHIPMENT',
        resourceId: shipment1.id,
        details: { trackingNumber: shipment1.trackingNumber, recipient: orgDist.name },
        timestamp: new Date(now.getTime() - 24 * 3600 * 1000)
      },
      // Distributor
      {
        userId: userDist.id,
        userName: userDist.fullName,
        userRole: userDist.role,
        organizationName: orgDist.name,
        action: 'HANDOFF_ACCEPTANCE',
        resourceType: 'HANDOFF',
        resourceId: shipment1.id,
        details: { status: 'ACCEPTED', location: 'Pune Loading Dock Bay 2' },
        timestamp: new Date(now.getTime() - 12 * 3600 * 1000)
      },
      {
        userId: userDist.id,
        userName: userDist.fullName,
        userRole: userDist.role,
        organizationName: orgDist.name,
        action: 'SHIPMENT_DISPATCH',
        resourceType: 'SHIPMENT',
        resourceId: shipment2.id,
        details: { trackingNumber: shipment2.trackingNumber, recipient: orgWh.name, carrier: shipment2.assignedCarrier },
        timestamp: new Date(now.getTime() - 4 * 3600 * 1000)
      },
      // Warehouse Operator
      {
        userId: userWh.id,
        userName: userWh.fullName,
        userRole: userWh.role,
        organizationName: orgWh.name,
        action: 'EXCURSION_MONITOR_FLAG',
        resourceType: 'ALERT',
        resourceId: batch5.id,
        details: { readingCelsius: 10.8, threshold: 8.0, alertId: 'CRITICAL_SPIKE_BAY3' },
        timestamp: new Date(now.getTime() - 45 * 60 * 1000)
      },
      {
        userId: userWh.id,
        userName: userWh.fullName,
        userRole: userWh.role,
        organizationName: orgWh.name,
        action: 'SHIPMENT_DISPATCH',
        resourceType: 'SHIPMENT',
        resourceId: shipment3.id,
        details: { trackingNumber: shipment3.trackingNumber, recipient: orgPharm.name },
        timestamp: new Date(now.getTime() - 3 * 3600 * 1000)
      },
      // Pharmacist
      {
        userId: userPharm.id,
        userName: userPharm.fullName,
        userRole: userPharm.role,
        organizationName: orgPharm.name,
        action: 'HANDOFF_ACCEPTANCE',
        resourceType: 'HANDOFF',
        resourceId: shipment4.id,
        details: { status: 'ACCEPTED', location: 'Apollo Central Pharmacy Dispensary Wing' },
        timestamp: new Date(now.getTime() - 6 * 3600 * 1000)
      },
      {
        userId: userPharm.id,
        userName: userPharm.fullName,
        userRole: userPharm.role,
        organizationName: orgPharm.name,
        action: 'PRESCRIPTION_DISPENSE',
        resourceType: 'BATCH',
        resourceId: batch8.id,
        details: { batchNumber: batch8.batchNumber, unitsDispensed: 50, rxId: 'RX-9041' },
        timestamp: new Date(now.getTime() - 1 * 3600 * 1000)
      }
    ]
  });

  // 11. Create Blockchain Ledger Transactions
  console.log('[Seed] Creating Blockchain Transaction Ledger proofs...');
  const txList = [
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'RegisterBatch',
      payloadHash: batch1.canonicalHash,
      status: 'CONFIRMED',
      blockNumber: 101,
      timestamp: new Date(now.getTime() - 24 * 3600 * 1000)
    },
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'DispatchShipment',
      payloadHash: shipment1.blockchainTxId,
      status: 'CONFIRMED',
      blockNumber: 102,
      timestamp: new Date(now.getTime() - 18 * 3600 * 1000)
    },
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'AcceptHandoff',
      payloadHash: computeCanonicalHash({ shipment: shipment1.trackingNumber, recipient: orgDist.name }),
      status: 'CONFIRMED',
      blockNumber: 103,
      timestamp: new Date(now.getTime() - 12 * 3600 * 1000)
    },
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'DispatchShipment',
      payloadHash: shipment2.blockchainTxId,
      status: 'CONFIRMED',
      blockNumber: 104,
      timestamp: new Date(now.getTime() - 4 * 3600 * 1000)
    },
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'FlagTemperatureExcursion',
      payloadHash: computeCanonicalHash({ sensor: 'SNS-COLD-003', temp: 10.8 }),
      status: 'CONFIRMED',
      blockNumber: 105,
      timestamp: new Date(now.getTime() - 45 * 60 * 1000)
    },
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'DispatchShipment',
      payloadHash: shipment3.blockchainTxId,
      status: 'CONFIRMED',
      blockNumber: 106,
      timestamp: new Date(now.getTime() - 3 * 3600 * 1000)
    },
    {
      txId: `0x${crypto.randomBytes(32).toString('hex')}`,
      channelId: 'meditrace-channel',
      chaincodeId: 'pharma-integrity',
      functionName: 'AcceptHandoff',
      payloadHash: computeCanonicalHash({ shipment: shipment4.trackingNumber, recipient: orgPharm.name }),
      status: 'CONFIRMED',
      blockNumber: 107,
      timestamp: new Date(now.getTime() - 1 * 3600 * 1000)
    }
  ];

  await prisma.blockchainTransaction.createMany({ data: txList });

  console.log('====================================================');
  console.log('✅ MediTrace Multi-Tenant Seed Complete!');
  console.log('Each role now has dedicated products, batches, shipments, sensors & handoffs:');
  console.log(' 1. Admin:        admin@meditrace.internal        / Admin@123456 (National Regulatory Authority)');
  console.log(' 2. Manufacturer: manufacturer@pfizer-demo.com   / Mfg@123456   (Pfizer Bio-Pharma Labs)');
  console.log(' 3. Distributor:  distributor@medexpress.com     / Dist@123456  (MedExpress Cold-Chain Logistics)');
  console.log(' 4. Warehouse:    warehouse@nordic-hub.com       / Wh@123456    (Nordic Central Vaccine Depot)');
  console.log(' 5. Pharmacist:   pharmacist@apollo-central.com  / Pharm@123456 (Apollo Central Healthcare Pharmacy)');
  console.log('====================================================');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
