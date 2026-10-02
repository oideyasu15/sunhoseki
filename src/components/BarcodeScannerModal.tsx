import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  QrCode,
  Volume2,
  VolumeX,
  Search,
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Product, ScannerMode } from '../types';
import { playScanBeep, playSuccessBeep, playErrorBeep } from '../utils/sound';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onStockAdjustment: (
    productId: string,
    delta: number,
    type: 'in' | 'out' | 'audit',
    reason: string
  ) => void;
}

interface ScannedHistoryItem {
  timestamp: string;
  product: Product;
  mode: ScannerMode;
  delta?: number;
  newStock?: number;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onStockAdjustment,
}) => {
  const [scannerMode, setScannerMode] = useState<ScannerMode>('lookup');
  const [batchAmount, setBatchAmount] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedItem, setLastScannedItem] = useState<{
    product: Product;
    message: string;
    isError?: boolean;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedHistoryItem[]>([]);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-video-region';
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Hardware Scanner (Keyboard Wedge) listener
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs other than global
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (target.id !== 'global-scanner-manual-input') {
          return;
        }
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = ''; // Reset buffer if typing too slow
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          e.preventDefault();
          handleBarcodeScanned(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scannerMode, batchAmount, soundEnabled, products, auditCounts]);

  // Start / Stop Camera Scanner
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Attempt starting camera when modal opens
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('利用可能なカメラが見つかりませんでした。');
        setIsCameraActive(false);
        return;
      }

      // Prefer back camera if mobile
      const backCamera = cameras.find(
        (c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('environment') ||
          c.label.toLowerCase().includes('rear')
      );
      const cameraId = backCamera ? backCamera.id : cameras[0].id;

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          handleBarcodeScanned(decodedText);
        },
        () => {
          // scanning frames
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError('カメラの起動に失敗しました（権限またはデバイスを確認してください）。手動入力またはバーコードリーダーをご利用いただけます。');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        // ignore
      }
      setIsCameraActive(false);
    }
  };

  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Debounce rapid duplicate scanning (must wait 1.2s before scanning the exact same code again)
    const now = Date.now();
    if (
      lastScannedCodeRef.current === cleanCode &&
      now - lastScannedTimeRef.current < 1200
    ) {
      return;
    }
    lastScannedCodeRef.current = cleanCode;
    lastScannedTimeRef.current = now;

    // Find product matching JAN code or SKU or ID
    const foundProduct = products.find(
      (p) =>
        p.janCode.toLowerCase() === cleanCode.toLowerCase() ||
        p.sku.toLowerCase() === cleanCode.toLowerCase() ||
        p.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (!foundProduct) {
      if (soundEnabled) playErrorBeep();
      setLastScannedItem({
        product: {
          id: 'unknown',
          name: `未登録商品 (コード: ${cleanCode})`,
          sku: cleanCode,
          janCode: cleanCode,
          category: 'その他',
          price: 0,
          costPrice: 0,
          stockQuantity: 0,
          minStockThreshold: 0,
          location: '未設定',
          images: [],
          primaryImageIndex: 0,
          description: '商品台帳に未登録のバーコードです。新規登録を行ってください。',
          tags: [],
          createdAt: '',
          updatedAt: '',
        },
        message: `該当する商品が見つかりません (コード: ${cleanCode})`,
        isError: true,
      });
      return;
    }

    // Sound effect
    if (soundEnabled) {
      if (scannerMode === 'lookup') {
        playScanBeep();
      } else {
        playSuccessBeep();
      }
    }

    // Handle action based on current scanner mode
    if (scannerMode === 'lookup') {
      setLastScannedItem({
        product: foundProduct,
        message: `「${foundProduct.name}」を照会しました`,
      });
    } else if (scannerMode === 'stock_in') {
      onStockAdjustment(
        foundProduct.id,
        batchAmount,
        'in',
        `バーコードスキャン入庫 (+${batchAmount})`
      );
      const newStock = foundProduct.stockQuantity + batchAmount;
      setLastScannedItem({
        product: { ...foundProduct, stockQuantity: newStock },
        message: `入庫完了: +${batchAmount}個 (現在庫: ${newStock}個)`,
      });
      setScanHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString('ja-JP'),
          product: foundProduct,
          mode: 'stock_in',
          delta: batchAmount,
          newStock,
        },
        ...prev.slice(0, 19),
      ]);
    } else if (scannerMode === 'stock_out') {
      onStockAdjustment(
        foundProduct.id,
        -batchAmount,
        'out',
        `バーコードスキャン出庫 (-${batchAmount})`
      );
      const newStock = Math.max(0, foundProduct.stockQuantity - batchAmount);
      setLastScannedItem({
        product: { ...foundProduct, stockQuantity: newStock },
        message: `出庫完了: -${batchAmount}個 (現在庫: ${newStock}個)`,
      });
      setScanHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString('ja-JP'),
          product: foundProduct,
          mode: 'stock_out',
          delta: -batchAmount,
          newStock,
        },
        ...prev.slice(0, 19),
      ]);
    } else if (scannerMode === 'audit') {
      const currentCount = (auditCounts[foundProduct.id] || 0) + 1;
      setAuditCounts((prev) => ({
        ...prev,
        [foundProduct.id]: currentCount,
      }));
      setLastScannedItem({
        product: foundProduct,
        message: `実地棚卸カウント: ${currentCount}個 (帳簿在庫: ${foundProduct.stockQuantity}個, 差異: ${currentCount - foundProduct.stockQuantity})`,
      });
      setScanHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString('ja-JP'),
          product: foundProduct,
          mode: 'audit',
          delta: currentCount,
          newStock: foundProduct.stockQuantity,
        },
        ...prev.slice(0, 19),
      ]);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeScanned(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] text-[#1A1A1A] flex items-center justify-between border-b border-[#FFD1DC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                バーコード＆JANスキャナー
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#FF69B4] border border-[#FFD1DC]">
                  即時照会・高速入出荷
                </span>
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                カメラ・USBバーコードリーダー・手動入力に対応
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              id="scanner-sound-toggle-btn"
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full text-xs transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-white text-[#FF69B4] border border-[#FFD1DC] hover:bg-[#FFF5F7]'
                  : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
              }`}
              title={soundEnabled ? '音声をミュート' : '音声を有効化'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Close button */}
            <button
              id="close-scanner-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-[#FFF5F7] px-5 py-3 border-b border-[#FFD1DC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-full shadow-2xs border border-[#FFD1DC]">
            <button
              id="scan-mode-lookup"
              type="button"
              onClick={() => setScannerMode('lookup')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                scannerMode === 'lookup'
                  ? 'bg-[#FF69B4] text-white shadow-xs'
                  : 'text-[#4A4A4A] hover:text-[#FF69B4] hover:bg-[#FFF0F5]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>照会・詳細</span>
            </button>

            <button
              id="scan-mode-stock-in"
              type="button"
              onClick={() => setScannerMode('stock_in')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                scannerMode === 'stock_in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#4A4A4A] hover:text-emerald-600 hover:bg-[#FFF0F5]'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>高速入庫 (+)</span>
            </button>

            <button
              id="scan-mode-stock-out"
              type="button"
              onClick={() => setScannerMode('stock_out')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                scannerMode === 'stock_out'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#4A4A4A] hover:text-amber-600 hover:bg-[#FFF0F5]'
              }`}
            >
              <PackageMinus className="w-3.5 h-3.5" />
              <span>高速出庫 (-)</span>
            </button>

            <button
              id="scan-mode-audit"
              type="button"
              onClick={() => setScannerMode('audit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                scannerMode === 'audit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[#4A4A4A] hover:text-indigo-600 hover:bg-[#FFF0F5]'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>棚卸カウント</span>
            </button>
          </div>

          {/* Batch quantity selector for Stock In/Out */}
          {(scannerMode === 'stock_in' || scannerMode === 'stock_out') && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#FFD1DC] text-xs">
              <span className="text-stone-500 font-bold">1回の数量:</span>
              {[1, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBatchAmount(num)}
                  className={`px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                    batchAmount === num
                      ? 'bg-[#FF69B4] text-white shadow-2xs'
                      : 'bg-[#FFF0F5] text-[#4A4A4A] hover:bg-[#FFE4EC]'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Camera View & Manual Input */}
          <div className="md:col-span-7 space-y-4">
            {/* Camera Frame */}
            <div className="relative rounded-3xl overflow-hidden bg-stone-950 border border-stone-800 shadow-inner flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px]">
              <div
                id={scannerContainerId}
                className="w-full max-w-[360px] overflow-hidden"
              />

              {/* Overlay Laser Scan Target Guide */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-64 h-36 border-2 border-[#FF69B4] rounded-2xl relative shadow-[0_0_20px_rgba(255,105,180,0.4)]">
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#FF69B4] to-transparent animate-pulse" />
                    {/* Corner marks */}
                    <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF69B4]" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF69B4]" />
                    <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF69B4]" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF69B4]" />
                  </div>
                  <p className="mt-3 text-[11px] text-pink-100 font-bold tracking-wide bg-black/70 px-3.5 py-1 rounded-full backdrop-blur-xs">
                    枠内にバーコード（JANコード）を合わせてください
                  </p>
                </div>
              )}

              {/* Camera Fallback / Inactive State */}
              {!isCameraActive && (
                <div className="p-6 text-center text-stone-300 max-w-sm">
                  <Camera className="w-10 h-10 mx-auto text-stone-500 mb-2" />
                  <p className="text-sm font-bold text-stone-200">
                    カメラは待機中または停止中です
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    {cameraError ||
                      'カメラを再起動するか、下のバーコード手動入力・テストボタンをご利用ください。'}
                  </p>
                  <button
                    id="restart-camera-btn"
                    type="button"
                    onClick={startCamera}
                    className="mt-3 px-4 py-2 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white text-xs font-bold shadow-md shadow-pink-900/30 transition-colors"
                  >
                    カメラを起動する
                  </button>
                </div>
              )}
            </div>

            {/* Manual input form & quick test barcodes */}
            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-[#FF69B4]" />
                  バーコード手動入力 / USBリーダー入力
                </span>
                <span className="text-[11px] text-stone-400 font-bold">
                  Enterキーで即時確定
                </span>
              </div>

              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  id="global-scanner-manual-input"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="JANコード(13桁) または SKUを入力..."
                  className="flex-1 px-4 py-2 text-sm bg-white border border-[#FFD1DC] rounded-full focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-mono"
                />
                <button
                  id="submit-manual-barcode-btn"
                  type="submit"
                  className="px-5 py-2 bg-[#FF69B4] hover:bg-[#ff52a5] text-white rounded-full text-xs font-bold shadow-md shadow-pink-200 transition-colors"
                >
                  確定
                </button>
              </form>

              {/* Quick sample barcode buttons for fast testing */}
              <div>
                <div className="text-[11px] text-stone-500 font-bold mb-1.5">
                  🌸 テスト用スキャン（サンプル商材）:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleBarcodeScanned(p.janCode)}
                      className="px-2.5 py-1 bg-white hover:bg-[#FFF0F5] border border-[#FFD1DC] hover:border-[#FF69B4] rounded-full text-[11px] text-[#4A4A4A] font-mono transition-colors text-left flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF69B4] inline-block" />
                      <span className="truncate max-w-[130px] font-sans font-bold text-[#1A1A1A]">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Last Scanned Result & History */}
          <div className="md:col-span-5 flex flex-col space-y-4">
            {/* Last Scanned Item Card */}
            <div className="bg-white rounded-3xl border border-[#FFD1DC] p-5 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#FFD1DC]/60 mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  最新のスキャン結果
                </span>
                {lastScannedItem && !lastScannedItem.isError && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    一致しました
                  </span>
                )}
              </div>

              {lastScannedItem ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Status Message */}
                    <div
                      className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                        lastScannedItem.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {lastScannedItem.isError ? (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>{lastScannedItem.message}</span>
                    </div>

                    {!lastScannedItem.isError && (
                      <div className="mt-3.5 flex gap-3.5">
                        {/* Product Photo */}
                        <div className="w-20 h-20 rounded-2xl bg-[#FFF5F7] border border-[#FFD1DC] overflow-hidden shrink-0">
                          {lastScannedItem.product.images.length > 0 ? (
                            <img
                              src={
                                lastScannedItem.product.images[
                                  lastScannedItem.product.primaryImageIndex || 0
                                ]
                              }
                              alt={lastScannedItem.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">
                              写真なし
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC] font-bold inline-block mb-1">
                            {lastScannedItem.product.category}
                          </span>
                          <h3 className="text-sm font-black text-[#1A1A1A] leading-snug line-clamp-2">
                            {lastScannedItem.product.name}
                          </h3>
                          <div className="text-xs font-mono text-stone-400 mt-0.5">
                            JAN: {lastScannedItem.product.janCode}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="font-black text-[#FF69B4]">
                              ¥{lastScannedItem.product.price.toLocaleString()}{' '}
                              <span className="text-[10px] text-stone-400 font-normal">
                                (税込)
                              </span>
                            </span>
                            <span className="text-stone-300">|</span>
                            <span className="font-bold text-[#4A4A4A]">
                              棚: {lastScannedItem.product.location || '未定'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stock count highlight & action */}
                  {!lastScannedItem.isError && (
                    <div className="bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#FFD1DC] flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-stone-500 font-bold">
                          現在の在庫数
                        </div>
                        <div className="text-xl font-black text-[#1A1A1A] flex items-baseline gap-1">
                          {lastScannedItem.product.stockQuantity}
                          <span className="text-xs font-normal text-stone-500">
                            個
                          </span>
                        </div>
                      </div>

                      <button
                        id="view-scanned-product-detail-btn"
                        type="button"
                        onClick={() => {
                          onSelectProduct(lastScannedItem.product);
                          onClose();
                        }}
                        className="px-4 py-2 bg-[#FF69B4] hover:bg-[#ff52a5] text-white text-xs font-bold rounded-full shadow-md shadow-pink-200 transition-colors flex items-center gap-1.5"
                      >
                        <span>台帳詳細を開く</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
                  <QrCode className="w-12 h-12 text-[#FFD1DC] mb-2 stroke-1" />
                  <p className="text-xs font-bold text-stone-500">
                    バーコードをスキャンするとここに商品情報が表示されます
                  </p>
                </div>
              )}
            </div>

            {/* Scan History in Current Session */}
            <div className="bg-white rounded-3xl border border-[#FFD1DC] p-4 shadow-xs max-h-48 overflow-y-auto">
              <div className="text-xs font-bold text-[#1A1A1A] mb-2.5 flex items-center justify-between">
                <span>セッション履歴 ({scanHistory.length}件)</span>
                {scanHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScanHistory([])}
                    className="text-[10px] text-[#FF69B4] hover:text-[#ff3b94] font-bold"
                  >
                    クリア
                  </button>
                )}
              </div>

              {scanHistory.length === 0 ? (
                <div className="text-xs text-stone-400 py-3 text-center font-medium">
                  履歴はありません
                </div>
              ) : (
                <div className="space-y-1.5">
                  {scanHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-2xl bg-[#FFF5F7] hover:bg-[#FFF0F5] flex items-center justify-between text-xs border border-[#FFD1DC]/60"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-stone-400">
                          {item.timestamp}
                        </span>
                        <span className="font-bold text-[#1A1A1A] truncate max-w-[160px]">
                          {item.product.name}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {item.mode === 'stock_in' && (
                          <span className="font-black text-emerald-600">
                            +{item.delta}
                          </span>
                        )}
                        {item.mode === 'stock_out' && (
                          <span className="font-black text-amber-600">
                            {item.delta}
                          </span>
                        )}
                        {item.mode === 'audit' && (
                          <span className="font-black text-indigo-600">
                            計 {item.delta}個
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FFF0F5] border-t border-[#FFD1DC] flex items-center justify-between text-xs text-stone-500 font-bold">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>スキャン待機中（JAN-13 / CODE-128 / CODE-39 対応）</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold border border-[#FFD1DC] shadow-2xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
