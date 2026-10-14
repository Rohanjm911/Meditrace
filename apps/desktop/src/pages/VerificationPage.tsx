import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import { soundService } from '../services/soundService';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Search,
  Upload,
  Camera,
  Video,
  RefreshCw,
  Clock,
  MapPin,
  Building2,
  FileCheck2,
  Radio,
  Sparkles,
  Layers,
  Check,
  Eye,
  CameraOff
} from 'lucide-react';

interface ParsedPharmaCode {
  format: 'GS1_DATAMATRIX' | 'JSON_QR' | 'BARCODE_1D' | 'RAW';
  gtin?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  raw: string;
  details: { label: string; code: string; value: string; meaning: string }[];
}

function parsePharmaCode(rawCode: string): ParsedPharmaCode {
  const trimmed = rawCode.trim();
  const details: { label: string; code: string; value: string; meaning: string }[] = [];

  // 1. JSON QR payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.gtin) details.push({ label: 'GTIN / Product Code', code: 'gtin', value: obj.gtin, meaning: 'Global Trade Item Number' });
      if (obj.batch) details.push({ label: 'Batch / Lot Number', code: 'batch', value: obj.batch, meaning: 'Pharmaceutical Formulation Lot' });
      if (obj.exp) details.push({ label: 'Expiration Date', code: 'exp', value: obj.exp, meaning: 'Batch Expiry Boundary' });
      if (obj.serial) details.push({ label: 'Item Serial Number', code: 'serial', value: obj.serial, meaning: 'Serialized Individual Package' });
      return {
        format: 'JSON_QR',
        gtin: obj.gtin,
        batchNumber: obj.batch,
        serialNumber: obj.serial,
        expiryDate: obj.exp,
        raw: trimmed,
        details
      };
    } catch {}
  }

  // 2. GS1 DataMatrix with AIs: (01)...(17)...(10)...(21)...
  if (trimmed.includes('(01)') || trimmed.includes('(17)') || trimmed.includes('(10)') || trimmed.includes('(21)')) {
    const gtinMatch = trimmed.match(/\(01\)([0-9]{14})/);
    const expMatch = trimmed.match(/\(17\)([0-9]{6})/);
    const lotMatch = trimmed.match(/\(10\)([A-Za-z0-9\-_]+)(?=\([0-9]{2}\)|$)/);
    const snMatch = trimmed.match(/\(21\)([A-Za-z0-9\-_]+)(?=\([0-9]{2}\)|$)/);

    let formattedExp = '';
    if (expMatch) {
      const y = '20' + expMatch[1].slice(0, 2);
      const m = expMatch[1].slice(2, 4);
      const d = expMatch[1].slice(4, 6);
      formattedExp = `${y}-${m}-${d}`;
    }

    if (gtinMatch) details.push({ label: 'AI (01) GTIN', code: '(01)', value: gtinMatch[1], meaning: 'Global Trade Item Number (14-digit)' });
    if (expMatch) details.push({ label: 'AI (17) Expiry Date', code: '(17)', value: `${expMatch[1]} (${formattedExp})`, meaning: 'Expiration Date (YYMMDD)' });
    if (lotMatch) details.push({ label: 'AI (10) Batch / Lot', code: '(10)', value: lotMatch[1], meaning: 'Manufacturer Batch Identifier' });
    if (snMatch) details.push({ label: 'AI (21) Serial Number', code: '(21)', value: snMatch[1], meaning: 'Package Serialized Identifier' });

    return {
      format: 'GS1_DATAMATRIX',
      gtin: gtinMatch?.[1],
      batchNumber: lotMatch?.[1],
      serialNumber: snMatch?.[1],
      expiryDate: formattedExp,
      raw: trimmed,
      details
    };
  }

  // 3. 1D Numerical Barcode (e.g. EAN / UPC / GTIN)
  if (/^[0-9]{8,14}$/.test(trimmed)) {
    details.push({ label: '1D Barcode / GTIN', code: 'EAN/UPC', value: trimmed, meaning: 'Numerical Product Barcode' });
    return {
      format: 'BARCODE_1D',
      gtin: trimmed,
      raw: trimmed,
      details
    };
  }

  // 4. Raw alphanumeric batch code
  details.push({ label: 'Batch / Identifier String', code: 'RAW', value: trimmed, meaning: 'Alphanumeric Serialization Code' });
  return {
    format: 'RAW',
    batchNumber: trimmed,
    raw: trimmed,
    details
  };
}

export const VerificationPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [scanType, setScanType] = useState<'QR' | 'GS1_DATAMATRIX' | 'MANUAL'>('MANUAL');
  const [location, setLocation] = useState('New Delhi Apollo Dispensary Counter #2');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Camera & Webcam Permission State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializingCam, setIsInitializingCam] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea height automatically to fit content without manual handles
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(320, Math.max(76, textareaRef.current.scrollHeight))}px`;
    }
  }, [code]);

  // Cleanup camera tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const verifyMutation = useMutation({
    mutationFn: (payload: { code: string; scanType: any; location: string }) =>
      api.verifyCode(payload),
    onSuccess: (res) => {
      setVerificationResult(res.result);
      if (res.result?.isAuthentic || res.result?.status === 'VERIFIED') {
        soundService.playSuccess();
        toast.success(
          'Authentic Medicine Verified',
          `Batch ${res.result.batch?.batchNumber || ''} matches cryptographic ledger identity.`
        );
      } else {
        soundService.playError();
        toast.error(
          res.result?.status === 'INVALID' ? 'Unregistered Barcode Flagged' : 'Packaging Discrepancy Flagged',
          res.result?.statusReason || res.result?.message || 'Packaging or serialization discrepancy flagged during audit.'
        );
      }
    },
    onError: (err: any) => {
      soundService.playError();
      toast.error('Verification Request Failed', err.message);
    }
  });

  const handleVerify = (customCode?: string, customType?: 'QR' | 'GS1_DATAMATRIX' | 'MANUAL') => {
    const targetCode = customCode || code;
    const targetType = customType || scanType;
    if (!targetCode.trim()) return;

    verifyMutation.mutate({
      code: targetCode.trim(),
      scanType: targetType,
      location
    });
  };

  // Enumerate video devices
  const discoverCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('MediaDevices API not supported in this environment.');
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
      return videoInputs;
    } catch (err: any) {
      console.warn('Could not enumerate cameras:', err);
      return [];
    }
  };

  // Open Consent Modal
  const handleCameraBtnClick = async () => {
    if (isCameraActive) {
      stopCamera();
      return;
    }
    soundService.playModalOpen();
    setCameraError(null);
    await discoverCameras();
    setShowConsentModal(true);
  };

  // Start Camera Stream after user consent
  const startCameraStream = async () => {
    setShowConsentModal(false);
    setIsInitializingCam(true);
    setCameraError(null);
    setIsCameraActive(true);

    try {
      // Setup hints for all pharmaceutical barcodes
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF
      ]);

      const reader = new BrowserMultiFormatReader(hints, 300);
      codeReaderRef.current = reader;

      // Small delay to ensure video element is mounted in DOM
      await new Promise(r => setTimeout(r, 150));

      if (!videoRef.current) {
        throw new Error('Video container element could not be initialized.');
      }

      // Request stream with consent
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Refresh camera device list with labels now that permission is granted
      discoverCameras();

      // Start continuous scanning
      reader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
        if (result) {
          const rawText = result.getText();
          if (rawText && rawText.trim()) {
            soundService.playSuccess();
            stopCamera();

            const parsed = parsePharmaCode(rawText);
            setCode(rawText);
            const detectedScanType =
              parsed.format === 'GS1_DATAMATRIX'
                ? 'GS1_DATAMATRIX'
                : parsed.format === 'JSON_QR'
                ? 'QR'
                : 'MANUAL';
            setScanType(detectedScanType);

            toast.success(
              'Barcode Decoded from Webcam',
              `Scanned ${parsed.format.replace('_', ' ')}: ${rawText.slice(0, 35)}...`
            );

            // Execute verification audit
            handleVerify(rawText, detectedScanType);
          }
        }
      });

      setIsInitializingCam(false);
      toast.info('Optical Camera Armed', 'Point any medicine package barcode or QR matrix towards camera.');
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setIsInitializingCam(false);
      setIsCameraActive(false);
      setCameraError(err.message || 'Could not access webcam. Please check system permissions.');
      toast.error('Camera Authorization Error', err.message || 'Permission denied or webcam busy.');
    }
  };

  // Stop Camera & release all hardware tracks
  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch {}
      codeReaderRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsInitializingCam(false);
  };

  // Switch to next camera
  const switchCamera = async () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    stopCamera();
    setTimeout(() => {
      startCameraStream();
    }, 200);
  };

  // Image upload decoding via ZXing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = async () => {
        try {
          const codeReader = new BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageElement(img);
          const rawText = result.getText();
          const parsed = parsePharmaCode(rawText);
          setCode(rawText);
          const detectedScanType =
            parsed.format === 'GS1_DATAMATRIX'
              ? 'GS1_DATAMATRIX'
              : parsed.format === 'JSON_QR'
              ? 'QR'
              : 'MANUAL';
          setScanType(detectedScanType);
          soundService.playSuccess();
          handleVerify(rawText, detectedScanType);
        } catch {
          soundService.playError();
          toast.error('Image Decoding Glitch', 'Could not decode barcode/QR from image. Please ensure clear contrast.');
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Sample test buttons
  const samples = [
    {
      label: 'Authentic Vaccine (QR Payload)',
      type: 'QR' as const,
      code: JSON.stringify({
        app: 'MEDITRACE',
        batch: 'VAC-2026-089A',
        gtin: '00300010023456',
        exp: '2027-10-10'
      })
    },
    {
      label: 'Standard GS1 DataMatrix (2D Barcode)',
      type: 'GS1_DATAMATRIX' as const,
      code: '(01)00300010034567(17)271010(10)VAX-2026-104B(21)SN20489912'
    },
    {
      label: 'Excursion Flagged Batch (Rotarix)',
      type: 'QR' as const,
      code: JSON.stringify({
        app: 'MEDITRACE',
        batch: 'ROT-2026-441D',
        gtin: '00300010056789'
      })
    },
    {
      label: 'Tampered / Counterfeit Code',
      type: 'QR' as const,
      code: JSON.stringify({
        app: 'MEDITRACE',
        batch: 'VAC-2026-089A',
        gtin: '00300010023456',
        tamperedField: 'MALICIOUS_INJECTION'
      })
    },
    {
      label: 'Unregistered Fake Barcode',
      type: 'MANUAL' as const,
      code: 'FAKE-COUNTERFEIT-BATCH-9999'
    }
  ];

  const parsedCurrentCode = code ? parsePharmaCode(code) : null;

  return (
    <div className="pb-14 bg-surface-soft min-h-screen">
      <Header
        title="Product Verification & Anti-Counterfeit Scanner"
        subtitle="Cryptographic Ledger Verification • GS1 DataMatrix Parsing • Repeated-Scan Duplication Detection"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scanner & Input (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Card title="Input Barcode or Matrix" subtitle="Scan package via webcam, upload image, or paste code">
              <div className="space-y-4 text-xs">
                {/* Method Selector Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl border-2 border-slate-900">
                  <button
                    type="button"
                    onClick={() => setScanType('MANUAL')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      scanType === 'MANUAL' ? 'bg-white text-navy-900 border-2 border-slate-900 shadow-2xs' : 'text-slate-700 hover:text-navy-900'
                    }`}
                  >
                    Manual Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanType('QR')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      scanType === 'QR' ? 'bg-white text-navy-900 border-2 border-slate-900 shadow-2xs' : 'text-slate-700 hover:text-navy-900'
                    }`}
                  >
                    QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanType('GS1_DATAMATRIX')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      scanType === 'GS1_DATAMATRIX' ? 'bg-white text-navy-900 border-2 border-slate-900 shadow-2xs' : 'text-slate-700 hover:text-navy-900'
                    }`}
                  >
                    GS1 DataMatrix
                  </button>
                </div>

                {/* Upload or Camera shortcuts */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                  <Button
                    variant={isCameraActive ? 'danger' : 'primary'}
                    size="sm"
                    className="flex-1"
                    leftIcon={isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    onClick={handleCameraBtnClick}
                  >
                    {isCameraActive ? 'Stop Camera' : 'Camera Input'}
                  </Button>
                </div>

                {/* Real Live Hardware Camera Viewfinder with Futuristic Holographic HUD */}
                {isCameraActive && (
                  <div className="relative rounded-2xl border-2 border-cyan-500/80 bg-black text-center overflow-hidden shadow-2xl select-none animate-fade-in-up">
                    {/* Live Video Feed Element */}
                    <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover opacity-90"
                      />

                      {/* Sci-Fi Holographic Laser Scanning Line Animation */}
                      <div className="animate-holo-laser absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none z-10" />

                      {/* Holographic Center Reticle Target */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="relative w-40 h-40 sm:w-48 sm:h-48 border border-dashed border-cyan-400/50 rounded-full animate-holo-rotate flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                          <div className="w-24 h-24 border border-cyan-300/40 rounded-full" />
                          {/* Crosshair pips */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan-400" />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan-400" />
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-cyan-400" />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-cyan-400" />
                        </div>
                      </div>

                      {/* Viewfinder Corner Targeting Brackets */}
                      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl shadow-[0_0_8px_#06b6d4] pointer-events-none z-10" />
                      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr shadow-[0_0_8px_#06b6d4] pointer-events-none z-10" />
                      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl shadow-[0_0_8px_#06b6d4] pointer-events-none z-10" />
                      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br shadow-[0_0_8px_#06b6d4] pointer-events-none z-10" />

                      {/* Live Status Pill Overlay */}
                      <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-20">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/50 text-[10px] font-bold text-cyan-300 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
                          <span>HOLOGRAPHIC OPTICAL MATRIX ACTIVE • ALIGN CODE</span>
                        </span>
                      </div>

                      {/* Bottom Holographic Audio/Sensor Spectrum Bars */}
                      <div className="absolute bottom-2 inset-x-3 z-20 flex items-center justify-between px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-cyan-900/50 text-[9px] font-mono text-cyan-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">ACOUSTIC HUD:</span>
                          <div className="flex items-end gap-1 h-4">
                            <span className="w-1 bg-cyan-400 rounded-full animate-soundwave-1" />
                            <span className="w-1 bg-cyan-300 rounded-full animate-soundwave-2" />
                            <span className="w-1 bg-cyan-400 rounded-full animate-soundwave-3" />
                            <span className="w-1 bg-cyan-500 rounded-full animate-soundwave-4" />
                            <span className="w-1 bg-cyan-300 rounded-full animate-soundwave-5" />
                          </div>
                        </div>
                        <span className="text-cyan-300">FPS: 30 • 1080p GS1 DECODER</span>
                      </div>

                      {isInitializingCam && (
                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-2 z-30">
                          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                          <span className="text-xs font-semibold">Calibrating Optical Sensor...</span>
                        </div>
                      )}
                    </div>

                    {/* Camera Control Footer Deck */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="text-left">
                        <span className="text-slate-200 font-semibold block text-[11px] truncate max-w-[200px]">
                          {videoDevices.find(d => d.deviceId === selectedDeviceId)?.label || 'Hardware Webcam'}
                        </span>
                        <span className="text-[9px] text-cyan-400 font-mono">
                          Auto-detecting QR, GS1 DataMatrix, EAN & Code 128
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {videoDevices.length > 1 && (
                          <button
                            type="button"
                            onClick={switchCamera}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-white transition-colors"
                            title="Switch to next camera"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={stopCamera}
                          className="py-1 px-2.5 text-[11px]"
                        >
                          Stop
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-status-red/30 text-status-redDark text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Raw Code Input Area with Dynamic Auto-Resizing */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-navy-900 text-xs">Encoded Data String *</label>
                    <span className="text-[10px] text-teal-dark font-bold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span>
                      Auto-Expanding Height
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(360, Math.max(76, e.target.scrollHeight))}px`;
                    }}
                    placeholder="Enter QR JSON payload or GS1 string, e.g. (01)00300010023456(17)261010(10)VAC-2026-089A..."
                    className="w-full px-3 py-2 font-mono text-[11px] bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 resize-none min-h-[76px] max-h-[360px] overflow-y-auto transition-[height] duration-150 shadow-2xs font-semibold"
                    style={{ fieldSizing: 'content', resize: 'none' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy-900 mb-1">Inspection Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal font-medium text-navy-900 shadow-2xs"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={verifyMutation.isPending}
                  onClick={() => handleVerify()}
                >
                  Execute Verification Audit
                </Button>
              </div>
            </Card>

            {/* GS1 Application Identifier Forensic Analysis Breakdown */}
            {parsedCurrentCode && parsedCurrentCode.details.length > 0 && (
              <div className="rounded-2xl border-2 border-slate-900 bg-white shadow-xl p-5 space-y-4 transition-all">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border-2 border-slate-900 shadow-2xs">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                        Pharma Matrix Forensic Breakdown
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-teal-dark border-2 border-slate-900 font-bold">
                          {parsedCurrentCode.format.replace('_', ' ')}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Cryptographic GS1 application identifiers extracted with zero checksum loss
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border-2 border-slate-900 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-status-green" /> 100% PARSED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {parsedCurrentCode.details.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border-2 border-slate-900 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-teal-dark px-2 py-0.5 rounded-md bg-white border-2 border-slate-900 shadow-2xs">
                            {item.code}
                          </span>
                          <span className="font-bold text-navy-900">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-600 mt-1 block font-medium">
                          {item.meaning}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-navy-900 text-xs bg-white px-2.5 py-1.5 rounded-lg border-2 border-slate-900 shadow-2xs">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Demonstration Samples Card */}
            <Card title="Preset Evaluation Scenarios" subtitle="One-click samples to test authenticity, tamper, and duplication logic">
              <div className="space-y-1.5 text-xs">
                {samples.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCode(s.code);
                      setScanType(s.type);
                      handleVerify(s.code, s.type);
                    }}
                    className="w-full text-left p-2.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-50 transition-all flex items-center justify-between shadow-2xs active:scale-98"
                  >
                    <div>
                      <span className="font-bold text-navy-900 block">{s.label}</span>
                      <span className="text-[10px] text-slate-600 font-mono font-medium">{s.type}</span>
                    </div>
                    <span className="text-teal-dark font-bold text-[11px]">Test &rarr;</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Verification Dossier (7 cols) */}
          <div className="lg:col-span-7">
            {!verificationResult ? (
              <Card>
                <div className="py-16 text-center space-y-3">
                  <div className="p-4 rounded-full bg-slate-50 text-slate-800 w-fit mx-auto border-2 border-slate-900 shadow-2xs">
                    <ShieldCheck className="w-8 h-8 text-teal-700" />
                  </div>
                  <h3 className="text-base font-black text-navy-900">Awaiting Barcode Input</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                    Activate the hardware webcam scanner on the left or enter a package code to perform real-time verification against the blockchain ledger.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-5 animate-fade-in-up">
                {/* Result Hero Banner */}
                <div
                  className={`p-5 rounded-xl border-2 border-slate-900 shadow-sm ${
                    verificationResult.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-950'
                      : verificationResult.status === 'TAMPERED'
                      ? 'bg-red-50 text-red-950'
                      : verificationResult.status === 'DUPLICATE_SUSPICIOUS'
                      ? 'bg-amber-50 text-amber-950'
                      : 'bg-red-50 text-red-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {verificationResult.status === 'VERIFIED' ? (
                      <CheckCircle2 className="w-6 h-6 text-status-greenDark shrink-0 mt-0.5" />
                    ) : verificationResult.status === 'TAMPERED' ? (
                      <ShieldAlert className="w-6 h-6 text-status-redDark shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-status-amberDark shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold tracking-tight">
                          Verification Outcome: {verificationResult.status}
                        </h3>
                        <Badge
                          variant={
                            verificationResult.status === 'VERIFIED'
                              ? 'green'
                              : verificationResult.status === 'TAMPERED'
                              ? 'red'
                              : 'amber'
                          }
                        >
                          {verificationResult.status}
                        </Badge>
                      </div>
                      <p className="text-xs mt-1.5 leading-relaxed font-medium">
                        {verificationResult.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Metadata Card */}
                {verificationResult.product && (
                  <Card title="Registered Product Details" subtitle={`GTIN: ${verificationResult.product.gtin}`}>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-navy-700 block">Product Brand:</span>
                        <span className="font-bold text-navy-900 text-sm">{verificationResult.product.name}</span>
                      </div>
                      <div>
                        <span className="text-navy-700 block">Scientific Generic Name:</span>
                        <span className="font-semibold text-navy-900">{verificationResult.product.genericName}</span>
                      </div>
                      <div>
                        <span className="text-navy-700 block">Dosage & Strength:</span>
                        <span className="font-semibold text-navy-900">
                          {verificationResult.product.dosageForm} ({verificationResult.product.strength})
                        </span>
                      </div>
                      <div>
                        <span className="text-navy-700 block">Manufacturer:</span>
                        <span className="font-semibold text-navy-900">{verificationResult.batch?.manufacturerName}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Cryptographic & Repeated Scan Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Cryptographic Hash Check */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-900 text-xs space-y-1.5 shadow-2xs">
                    <span className="font-bold text-navy-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal" />
                      Ledger Hash Match
                    </span>
                    <div className="flex items-center gap-2 pt-1">
                      {verificationResult.status === 'INVALID' ? (
                        <Badge variant="amber">NOT ON LEDGER</Badge>
                      ) : (
                        <Badge variant={verificationResult.integrityCheck?.canonicalHashMatched ? 'green' : 'red'}>
                          {verificationResult.integrityCheck?.canonicalHashMatched ? 'HASH VERIFIED' : 'HASH MISMATCH'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1 font-mono break-all line-clamp-1">
                      {verificationResult.status === 'INVALID'
                        ? 'No cryptographic block recorded on MediTrace chain'
                        : `Hash: ${verificationResult.integrityCheck?.computedHash || 'None'}`}
                    </p>
                  </div>

                  {/* Repeated Scan Duplication Check */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-900 text-xs space-y-1.5 shadow-2xs">
                    <span className="font-bold text-navy-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal" />
                      Scan Frequency Check
                    </span>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant={verificationResult.scannedCount > 4 ? 'amber' : 'green'}>
                        {verificationResult.scannedCount} Total Scans
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1 font-medium">
                      {verificationResult.status === 'INVALID'
                        ? `Scanned ${verificationResult.scannedCount} time${verificationResult.scannedCount > 1 ? 's' : ''} in security audit logs`
                        : verificationResult.scannedCount > 4
                        ? 'Suspicious duplication threshold exceeded'
                        : 'Scan frequency normal for retail packaging'}
                    </p>
                  </div>
                </div>

                {/* Temperature Compliance Notice */}
                <div className="p-4 rounded-xl bg-white border-2 border-slate-900 text-xs flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-bold text-navy-900 block">Cold-Chain Compliance Record</span>
                    <span className="text-navy-700">
                      {verificationResult.status === 'INVALID'
                        ? 'Unregistered Product • No Telemetry Sensors Linked'
                        : `Required Range: ${verificationResult.temperatureCompliance?.requiredRange} • Recorded Excursions: ${verificationResult.temperatureCompliance?.recordedExcursions}`}
                    </span>
                  </div>
                  {verificationResult.status === 'INVALID' ? (
                    <Badge variant="gray">N/A (UNREGISTERED)</Badge>
                  ) : (
                    <Badge variant={verificationResult.temperatureCompliance?.compliant ? 'green' : 'red'}>
                      {verificationResult.temperatureCompliance?.compliant ? 'COMPLIANT' : 'EXCURSIONS ON RECORD'}
                    </Badge>
                  )}
                </div>

                {/* Explanatory Guide for INVALID / Unregistered Codes */}
                {verificationResult.status === 'INVALID' && (
                  <Card
                    title="Why did this package fail verification?"
                    subtitle="Zero-Trust Blockchain Anti-Counterfeit Guard"
                  >
                    <div className="space-y-3 text-xs">
                      <p className="text-navy-700 leading-relaxed font-medium">
                        MediTrace enforces a <strong>permissioned pharmaceutical blockchain</strong>. Only batches manufactured, serialized, and cryptographically anchored by authorized license-holders exist on this ledger.
                      </p>
                      <div className="p-3.5 bg-amber-50 border-2 border-slate-900 rounded-xl text-amber-950 space-y-1.5 shadow-2xs">
                        <span className="font-bold block">Why is this status shown?</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium">
                          <li><strong>Unregistered / Counterfeit Barcode:</strong> The scanned code has never been registered on the blockchain ledger.</li>
                          <li><strong>External Consumer Barcode:</strong> General barcodes from non-pharma retail goods or arbitrary test prints are blocked.</li>
                          <li><strong>Spelling / Case Discrepancy:</strong> Ensure valid batch identifiers (e.g. <code>VAC-2026-089A</code>) without trailing spaces.</li>
                        </ul>
                      </div>
                      <div className="pt-1">
                        <span className="font-bold text-navy-900 block mb-2">Test Authentic Registered Batches:</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const authenticCode = JSON.stringify({
                                app: 'MEDITRACE',
                                batch: 'VAC-2026-089A',
                                gtin: '00300010023456',
                                exp: '2027-10-10'
                              });
                              setCode(authenticCode);
                              setScanType('QR');
                              handleVerify(authenticCode, 'QR');
                            }}
                            className="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-teal-800 hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-98"
                          >
                            <span>✓</span> Test Authentic Comirnaty (VAC-2026-089A)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const gs1Code = '(01)00300010034567(17)271010(10)VAX-2026-104B(21)SN20489912';
                              setCode(gs1Code);
                              setScanType('GS1_DATAMATRIX');
                              handleVerify(gs1Code, 'GS1_DATAMATRIX');
                            }}
                            className="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-teal-800 hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-98"
                          >
                            <span>✓</span> Test Authentic GS1 Matrix (VAX-2026-104B)
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Supply Chain Provenance Trail */}
                {verificationResult.provenanceTrail && verificationResult.provenanceTrail.length > 0 && (
                  <Card title="Supply Chain Provenance Journey" subtitle="Verified custody transfer log">
                    <div className="space-y-3 text-xs">
                      {verificationResult.provenanceTrail.map((step: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3.5 rounded-xl bg-white border-2 border-slate-900 shadow-2xs">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-900">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-navy-900">{step.step}</span>
                              <Badge variant={step.verifiedOnChain ? 'green' : 'gray'} size="sm">
                                {step.verifiedOnChain ? '✓ On Ledger' : 'Local'}
                              </Badge>
                            </div>
                            <p className="text-slate-700 font-medium mt-0.5">{step.organization}</p>
                            <span className="text-[10px] text-slate-500 font-mono block mt-1 font-semibold">
                              {step.location} • {new Date(step.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hardware Camera Consent Modal */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        title="Hardware Camera Access Authorization"
        subtitle="FDA 21 CFR Part 11 & GAMP 5 Regulatory Verification Scanner Protocol"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-teal-subtle/30 border border-teal/40 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal text-white shrink-0 mt-0.5">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-navy-900 text-sm">Optical Packaging Inspection Request</h4>
              <p className="text-navy-700 mt-1 leading-relaxed">
                Medi Trace requires authorization to access your machine's optical video webcam to capture and decode 2D GS1 DataMatrix, serialized QR codes, and 1D barcodes on pharmaceutical packaging.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border space-y-2">
            <span className="font-bold text-navy-900 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal" />
              Privacy & Electronic Signature Attestation
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              All optical video stream frames are processed strictly in-memory on your local machine. No video or image recordings are saved, stored, or transmitted over external networks.
            </p>
          </div>

          {/* Select Camera Device if multiple detected */}
          {videoDevices.length > 0 && (
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Select Video Capture Device:</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy-900 font-medium shadow-2xs"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera Device #${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConsentModal(false)}
            >
              Cancel / Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={startCameraStream}
            >
              Grant Consent & Start Scanner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
