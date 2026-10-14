/**
 * MediTrace IoT Cold-Chain Temperature Simulator
 * Generates realistic time-series sensor readings, cold-chain excursion events, and sensor disconnect states.
 * All readings are strictly labelled `isSimulated: true`.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.IOT_SIMULATOR_PORT || '4001', 10);
const API_URL = process.env.API_URL || 'http://localhost:4000';

type SimulationMode = 'NORMAL' | 'EXCURSION' | 'DISCONNECTED';

interface SensorConfig {
  sensorId: string;
  serialNumber: string;
  name: string;
  location: string;
  targetTemp: number; // e.g. 4.0 for standard 2-8°C, or -75.0 for ULT
  minAllowed: number;
  maxAllowed: number;
  currentTemp: number;
}

let isRunning = true;
let simulationMode: SimulationMode = (process.env.IOT_SIMULATION_MODE as SimulationMode) || 'NORMAL';
let intervalMs = parseInt(process.env.IOT_SIMULATOR_INTERVAL_MS || '5000', 10);
let readingsEmittedCount = 0;
let lastTickTimestamp: string | null = null;
let timerId: NodeJS.Timeout | null = null;

const sensors: SensorConfig[] = [
  {
    sensorId: '',
    serialNumber: 'SNS-COLD-001',
    name: 'CryoLogger ULT Sensor Probe #1',
    location: 'Pune MFG Vault A (Pfizer)',
    targetTemp: -75.0,
    minAllowed: -90.0,
    maxAllowed: -60.0,
    currentTemp: -75.2
  },
  {
    sensorId: '',
    serialNumber: 'SNS-COLD-002',
    name: 'Reefer Tracker Fleet Unit #42',
    location: 'MedExpress Reefer Vehicle KA-01-EXP-99',
    targetTemp: 4.5,
    minAllowed: 2.0,
    maxAllowed: 8.0,
    currentTemp: 4.6
  },
  {
    sensorId: '',
    serialNumber: 'SNS-COLD-003',
    name: 'Hub Bay 3 Sensor Telemetry Pod',
    location: 'Nordic Central Vaccine Depot - Bay 3',
    targetTemp: 4.0,
    minAllowed: 2.0,
    maxAllowed: 8.0,
    currentTemp: 9.8 // configured near excursion in demo
  },
  {
    sensorId: '',
    serialNumber: 'SNS-WH-BAY01',
    name: 'Depot Bay 1 Cryo Chamber Monitor',
    location: 'Nordic Central Vaccine Depot - Bay 1 ULT Vault',
    targetTemp: -75.0,
    minAllowed: -90.0,
    maxAllowed: -60.0,
    currentTemp: -78.2
  },
  {
    sensorId: '',
    serialNumber: 'SNS-PHARM-FRG01',
    name: 'Apollo Dispensary Cold Storage Probe',
    location: 'Apollo Central Healthcare Pharmacy - Dispensary Fridge #1',
    targetTemp: 3.5,
    minAllowed: 2.0,
    maxAllowed: 8.0,
    currentTemp: 3.4
  }
];

// Helper to generate simulated temperature variations
function stepTemperature(sensor: SensorConfig, mode: SimulationMode): { temp: number; isExcursion: boolean } {
  let delta = (Math.random() - 0.5) * 0.4;

  if (mode === 'EXCURSION') {
    // Force gradual warming past max threshold
    delta = 0.6 + Math.random() * 0.4;
  } else if (mode === 'NORMAL') {
    // Gently gravitate towards target temperature
    const pull = (sensor.targetTemp - sensor.currentTemp) * 0.15;
    delta += pull;
  }

  sensor.currentTemp = parseFloat((sensor.currentTemp + delta).toFixed(2));
  const isExcursion = sensor.currentTemp < sensor.minAllowed || sensor.currentTemp > sensor.maxAllowed;

  return {
    temp: sensor.currentTemp,
    isExcursion
  };
}

async function emitTick() {
  if (!isRunning || simulationMode === 'DISCONNECTED') {
    return;
  }

  lastTickTimestamp = new Date().toISOString();

  for (const sensor of sensors) {
    const { temp, isExcursion } = stepTemperature(sensor, simulationMode);
    readingsEmittedCount++;

    const payload = {
      serialNumber: sensor.serialNumber,
      temperatureCelsius: temp,
      humidityPercent: parseFloat((55 + Math.random() * 5).toFixed(1)),
      batteryLevel: 94.5,
      location: sensor.location,
      isSimulated: true, // MANDATORY: Explicitly labelled as simulated
      isExcursion,
      timestamp: lastTickTimestamp
    };

    try {
      const res = await fetch(`${API_URL}/api/telemetry/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simulator-source': 'meditrace-iot-simulator'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        // Log quietly without crashing if backend is starting up
      }
    } catch {
      // Backend not yet reachable; continue loop
    }
  }
}

function startLoop() {
  if (timerId) clearInterval(timerId);
  isRunning = true;
  timerId = setInterval(emitTick, intervalMs);
  console.log(`[IoT Simulator] Started loop at ${intervalMs}ms interval (Mode: ${simulationMode})`);
}

function stopLoop() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  isRunning = false;
  console.log('[IoT Simulator] Stopped telemetry emission loop.');
}

// REST endpoints for Simulator control
app.get('/status', (_req, res) => {
  res.json({
    isRunning,
    simulationMode,
    intervalMs,
    activeSensors: sensors.length,
    readingsEmittedCount,
    lastTickTimestamp,
    sensors: sensors.map(s => ({
      serialNumber: s.serialNumber,
      name: s.name,
      currentTemp: s.currentTemp,
      minAllowed: s.minAllowed,
      maxAllowed: s.maxAllowed,
      location: s.location
    }))
  });
});

app.post('/config', (req, res) => {
  const { mode, newIntervalMs, targetSensorSerial, manualTemp } = req.body;
  if (mode && ['NORMAL', 'EXCURSION', 'DISCONNECTED'].includes(mode)) {
    simulationMode = mode as SimulationMode;
  }
  if (newIntervalMs && typeof newIntervalMs === 'number' && newIntervalMs >= 1000) {
    intervalMs = newIntervalMs;
    if (isRunning) startLoop();
  }
  if (targetSensorSerial && typeof manualTemp === 'number') {
    const s = sensors.find(item => item.serialNumber === targetSensorSerial);
    if (s) {
      s.currentTemp = manualTemp;
    }
  }
  res.json({ success: true, mode: simulationMode, intervalMs });
});

app.post('/start', (_req, res) => {
  startLoop();
  res.json({ success: true, isRunning: true });
});

app.post('/stop', (_req, res) => {
  stopLoop();
  res.json({ success: true, isRunning: false });
});

app.post('/emit-deterministic', async (req, res) => {
  const { serialNumber, temperatureCelsius, isExcursion } = req.body;
  const s = sensors.find(item => item.serialNumber === serialNumber) || sensors[0];
  const payload = {
    serialNumber: s.serialNumber,
    temperatureCelsius: typeof temperatureCelsius === 'number' ? temperatureCelsius : s.currentTemp,
    humidityPercent: 50.0,
    batteryLevel: 98.0,
    location: s.location,
    isSimulated: true,
    isExcursion: !!isExcursion,
    timestamp: new Date().toISOString()
  };

  try {
    const backendRes = await fetch(`${API_URL}/api/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await backendRes.json();
    res.json({ success: true, ingested: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start service
app.listen(PORT, () => {
  console.log(`[IoT Simulator] Running on http://localhost:${PORT}`);
  startLoop();
});
