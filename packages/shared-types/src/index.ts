export enum UserRole {
  ADMIN = 'ADMIN',
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  WAREHOUSE_OPERATOR = 'WAREHOUSE_OPERATOR',
  PHARMACIST = 'PHARMACIST'
}

export enum OrganizationType {
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  WAREHOUSE = 'WAREHOUSE',
  PHARMACY = 'PHARMACY',
  REGULATOR = 'REGULATOR'
}

export enum BatchStatus {
  REGISTERED = 'REGISTERED',
  IN_TRANSIT = 'IN_TRANSIT',
  STORED = 'STORED',
  DELIVERED = 'DELIVERED',
  RECALLED = 'RECALLED',
  QUARANTINED = 'QUARANTINED'
}

export enum ShipmentStatus {
  CREATED = 'CREATED',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum HandoffStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  INCONCLUSIVE = 'INCONCLUSIVE',
  INVALID = 'INVALID',
  TAMPERED = 'TAMPERED',
  DUPLICATE_SUSPICIOUS = 'DUPLICATE_SUSPICIOUS',
  FLAGGED_REVIEW = 'FLAGGED_REVIEW'
}

export enum BlockchainTxStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  DEMO_RECORDED = 'DEMO_RECORDED'
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  licenseNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  genericName: string;
  gtin: string; // Global Trade Item Number (14 digits)
  dosageForm: string; // e.g. "Injectable Suspension", "Oral Tablet"
  strength: string; // e.g. "0.5ml", "500mg"
  manufacturerId: string;
  manufacturerName?: string;
  description: string;
  minTempCelsius: number;
  maxTempCelsius: number;
  requiresColdChain: boolean;
  regulatoryApprovalId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  product?: Product;
  manufacturerId: string;
  manufacturerName?: string;
  mfgDate: string;
  expDate: string;
  quantity: number;
  remainingQuantity: number;
  unitOfMeasure: string;
  minTempCelsius: number;
  maxTempCelsius: number;
  status: BatchStatus;
  canonicalHash?: string;
  blockchainTxId?: string;
  blockchainConfirmed: boolean;
  blockchainMode: 'FABRIC_LIVE' | 'DEMO_INTEGRITY';
  qrPayload: string;
  gs1DataMatrixPayload: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  batchId: string;
  batch?: Batch;
  quantity: number;
}

export interface HandoffEvent {
  id: string;
  shipmentId: string;
  senderOrgId: string;
  senderOrgName?: string;
  senderUserId: string;
  senderUserName?: string;
  recipientOrgId: string;
  recipientOrgName?: string;
  recipientUserId?: string;
  recipientUserName?: string;
  status: HandoffStatus;
  location: string;
  notes?: string;
  rejectionReason?: string;
  blockchainTxId?: string;
  blockchainConfirmed: boolean;
  timestamp: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  senderOrgId: string;
  senderOrgName?: string;
  recipientOrgId: string;
  recipientOrgName?: string;
  assignedCarrier?: string;
  status: ShipmentStatus;
  originLocation: string;
  destinationLocation: string;
  items: ShipmentItem[];
  handoffs: HandoffEvent[];
  sensorId?: string;
  blockchainTxId?: string;
  blockchainConfirmed: boolean;
  dispatchTime?: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  batchId?: string;
  shipmentId?: string;
  temperatureCelsius: number;
  humidityPercent?: number;
  isSimulated: boolean;
  isExcursion: boolean;
  batteryLevel?: number;
  location?: string;
  timestamp: string;
}

export interface TemperatureAlert {
  id: string;
  sensorId: string;
  batchId?: string;
  batchNumber?: string;
  productName?: string;
  shipmentId?: string;
  trackingNumber?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  readingCelsius: number;
  minThresholdCelsius: number;
  maxThresholdCelsius: number;
  durationMinutes: number;
  message: string;
  isSimulated: boolean;
  acknowledgedByUserId?: string;
  acknowledgedByUserName?: string;
  acknowledgedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRequest {
  code: string; // Raw QR string or GS1 DataMatrix raw string
  scanType: 'QR' | 'GS1_DATAMATRIX' | 'MANUAL';
  location?: string;
}

export interface VerificationResult {
  code: string;
  scanType: 'QR' | 'GS1_DATAMATRIX' | 'MANUAL';
  status: VerificationStatus;
  message: string;
  parsedFields?: {
    gtin?: string;
    batchNumber?: string;
    expiryDate?: string;
    serialNumber?: string;
  };
  product?: Product;
  batch?: Batch;
  provenanceTrail: Array<{
    step: string;
    organization: string;
    role: string;
    timestamp: string;
    location: string;
    verifiedOnChain: boolean;
    txId?: string;
  }>;
  temperatureCompliance: {
    compliant: boolean;
    recordedExcursions: number;
    highestRecordedTemp?: number;
    lowestRecordedTemp?: number;
    requiredRange: string;
  };
  integrityCheck: {
    canonicalHashMatched: boolean;
    computedHash: string;
    storedHash?: string;
    blockchainTxId?: string;
    blockchainStatus: BlockchainTxStatus;
  };
  scannedCount: number;
  firstScannedAt?: string;
  lastScannedAt: string;
  isSimulatedTelemetry: boolean;
  verifiedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  organizationName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemHealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    latencyMs: number;
    engine: string;
    databaseName: string;
  };
  blockchain: {
    mode: 'FABRIC_LIVE' | 'DEMO_INTEGRITY';
    connected: boolean;
    channelName?: string;
    chaincodeId?: string;
    peers?: string[];
    gatewayEndpoint?: string;
    statusDetails: string;
  };
  iotSimulator: {
    isRunning: boolean;
    activeSensors: number;
    readingsEmittedLastMinute: number;
    lastTickTimestamp?: string;
    mode: 'NORMAL' | 'EXCURSION' | 'DISCONNECTED';
  };
}
