import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  RefreshCw,
  Trash2,
  Check,
  Tag,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Package,
  MapPin,
  FileText,
  AlertCircle,
  Wand2,
  ExternalLink,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import {
  generateRandomJanCode,
  calculateJanCheckDigit,
  renderBarcodeToSvg,
} from '../utils/barcode';
import { PRESET_SAMPLE_PHOTOS } from '../data/sampleProducts';
import { playShutterSound } from '../utils/sound';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
}

const CATEGORIES: ProductCategory[] = [
  'ほっぺちゃん',
  '福袋・ハッピーバッグ',
  'ヘアアクセサリー',
  'リング・ネックレス',
  'イヤリング・ピアス',
  'デコ・DIYパーツ',
  '文具・ステーショナリー',
  'キッズコスメ・雑貨',
  'バッグ・ポーチ',
  'その他',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [janCode, setJanCode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('ほっぺちゃん');
  const [price, setPrice] = useState<number>(280);
  const [costPrice, setCostPrice] = useState<number>(90);
  const [stockQuantity, setStockQuantity] = useState<number>(20);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(10);
  const [location, setLocation] = useState('A-01-1');
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [catchphrase, setCatchphrase] = useState('');
  const [tags, setTags] = useState<string[]>(['サン宝石', '人気']);
  const [tagInput, setTagInput] = useState('');
  const [supplier, setSupplier] = useState('サン宝石オリジナル企画');

  // Camera capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // AI loading states
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiAnalyzingImage, setIsAiAnalyzingImage] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Barcode live preview SVG
  const [barcodeSvg, setBarcodeSvg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize form when opening or changing product
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku);
      setJanCode(initialProduct.janCode);
      setCategory(initialProduct.category);
      setPrice(initialProduct.price);
      setCostPrice(initialProduct.costPrice);
      setStockQuantity(initialProduct.stockQuantity);
      setMinStockThreshold(initialProduct.minStockThreshold);
      setLocation(initialProduct.location);
      setImages(initialProduct.images || []);
      setPrimaryImageIndex(initialProduct.primaryImageIndex || 0);
      setDescription(initialProduct.description || '');
      setCatchphrase(initialProduct.catchphrase || '');
      setTags(initialProduct.tags || []);
      setSupplier(initialProduct.supplier || '');
    } else {
      // New product defaults
      const newJan = generateRandomJanCode();
      const randomSku = `SUN-${Math.floor(100 + Math.random() * 900)}`;
      setName('');
      setSku(randomSku);
      setJanCode(newJan);
      setCategory('ほっぺちゃん');
      setPrice(280);
      setCostPrice(90);
      setStockQuantity(20);
      setMinStockThreshold(10);
      setLocation('A-01-1');
      setImages([
        'https://images.unsplash.com/photo-1582845512747-e42001c95638?w=500&auto=format&fit=crop&q=80',
      ]);
      setPrimaryImageIndex(0);
      setDescription('サン宝石オリジナルのキュートなアイテムです。');
      setCatchphrase('サン宝石☆大人気アイテム！');
      setTags(['サン宝石', 'プチプラ']);
      setSupplier('サン宝石オリジナル企画');
    }
  }, [initialProduct, isOpen]);

  // Update barcode preview SVG
  useEffect(() => {
    if (janCode.trim()) {
      const svg = renderBarcodeToSvg(janCode.trim(), {
        height: 40,
        fontSize: 12,
      });
      setBarcodeSvg(svg);
    } else {
      setBarcodeSvg('');
    }
  }, [janCode]);

  // Handle image upload from file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (loadEv) => {
        if (loadEv.target?.result) {
          setImages((prev) => [...prev, loadEv.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Start Camera for snapshot
  const startCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 640 },
      });
      setCameraStream(stream);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('カメラの起動に失敗しました。カメラ権限を許可してください。');
    }
  };

  const stopCameraCapture = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    playShutterSound();

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImages((prev) => [...prev, dataUrl]);
    }
    stopCameraCapture();
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // AI Description & Copy Generator
  const handleGenerateAiCopy = async () => {
    setIsAiGenerating(true);
    setAiMessage(null);
    try {
      const currentImage = images[primaryImageIndex] || '';
      const response = await fetch('/api/gemini/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          price,
          features: description,
          imageBase64: currentImage.startsWith('data:') ? currentImage : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.catchphrase) setCatchphrase(data.catchphrase);
        if (data.description) setDescription(data.description);
        if (data.suggestedTags && Array.isArray(data.suggestedTags)) {
          const merged = Array.from(new Set([...tags, ...data.suggestedTags]));
          setTags(merged);
        }
        setAiMessage('✨ AIがサン宝石風の商品コピーとタグを自動生成しました！');
      } else {
        setAiMessage('AI生成に失敗しました。');
      }
    } catch (err) {
      setAiMessage('サーバー接続エラーが発生しました。');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // AI Photo Inspector
  const handleAnalyzePhoto = async () => {
    if (images.length === 0) {
      alert('先に商品写真を追加してください。');
      return;
    }
    setIsAiAnalyzingImage(true);
    setAiMessage(null);
    try {
      const currentImage = images[primaryImageIndex] || images[0];
      const response = await fetch('/api/gemini/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.detectedName && !name) setName(data.detectedName);
        if (data.detectedCategory) setCategory(data.detectedCategory as ProductCategory);
        if (data.estimatedPrice && (!price || price === 280)) setPrice(data.estimatedPrice);
        if (data.summary && (!description || description.length < 20)) {
          setDescription(data.summary);
        }
        if (data.suggestedTags && Array.isArray(data.suggestedTags)) {
          setTags(Array.from(new Set([...tags, ...data.suggestedTags])));
        }
        setAiMessage(`🔍 AI分析完了: ${data.detectedCategory}として認識しました！`);
      }
    } catch (err) {
      setAiMessage('写真のAI分析に失敗しました。');
    } finally {
      setIsAiAnalyzingImage(false);
    }
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('商品名を入力してください。');
      return;
    }

    if (!janCode.trim()) {
      alert('JAN/バーコードを入力してください。');
      return;
    }

    const product: Product = {
      id: initialProduct?.id || `sh-${Date.now()}`,
      sku: sku.trim() || `SKU-${Date.now()}`,
      janCode: janCode.trim(),
      name: name.trim(),
      category,
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      minStockThreshold: Number(minStockThreshold) || 5,
      location: location.trim() || '未設定',
      images: images.length > 0 ? images : [],
      primaryImageIndex: primaryImageIndex < images.length ? primaryImageIndex : 0,
      description: description.trim(),
      catchphrase: catchphrase.trim(),
      tags,
      supplier: supplier.trim(),
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">
                {initialProduct ? '商品情報の編集' : '新規商材の登録'}
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                写真・バーコード・在庫情報を一元登録
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.open(window.location.href, '_blank');
              }}
              title="別ウィンドウ・別タブで新しく開いて並行作業する（登録データは即時同期・自動統合されます）"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-stone-600 border border-[#FFD1DC] hover:text-[#FF69B4] hover:border-[#FF69B4] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>別ウィンドウで開く</span>
            </button>
            <button
              id="close-product-form-modal"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Notification Banner */}
        {aiMessage && (
          <div className="bg-[#FFF5F7] border-b border-[#FFD1DC] px-6 py-2.5 text-xs font-bold text-[#FF69B4] flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF69B4]" />
              {aiMessage}
            </span>
            <button
              type="button"
              onClick={() => setAiMessage(null)}
              className="text-[#FF69B4] hover:text-[#ff3b94] font-bold p-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Form Body */}
        <form
          id="product-registration-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Section 1: Photos Management */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF69B4]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  商品写真（複数登録可）
                </h3>
                <span className="text-[11px] text-stone-400 font-bold">
                  {images.length}枚登録済み
                </span>
              </div>

              <div className="flex items-center gap-2">
                {images.length > 0 && (
                  <button
                    id="ai-analyze-photo-btn"
                    type="button"
                    onClick={handleAnalyzePhoto}
                    disabled={isAiAnalyzingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FF69B4] bg-[#FFF0F5] border border-[#FFD1DC] hover:bg-[#FFE4EC] rounded-full transition-colors shadow-2xs"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isAiAnalyzingImage ? 'animate-spin' : ''}`} />
                    <span>{isAiAnalyzingImage ? '分析中...' : '写真からAI認識'}</span>
                  </button>
                )}

                <button
                  id="camera-photo-btn"
                  type="button"
                  onClick={startCameraCapture}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#4A4A4A] bg-white border border-[#FFD1DC] hover:bg-[#FFF0F5] rounded-full transition-colors shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5 text-stone-500" />
                  <span>カメラで撮影</span>
                </button>

                <button
                  id="upload-photo-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#FF69B4] hover:bg-[#ff52a5] rounded-full transition-colors shadow-md shadow-pink-200"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ファイル追加</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Live Camera Snapshot Modal Overlay */}
            {isCapturing && (
              <div className="mb-4 p-4 bg-stone-900 rounded-3xl text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-sm mx-auto rounded-2xl mb-3 bg-black aspect-square object-cover"
                />
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2.5 bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-bold rounded-full text-xs shadow-lg flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>シャッターを切る</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraCapture}
                    className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-full text-xs"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`relative group rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                    primaryImageIndex === idx
                      ? 'border-[#FF69B4] shadow-md ring-2 ring-pink-200'
                      : 'border-[#FFD1DC] hover:border-pink-300'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Cover Badge */}
                  {primaryImageIndex === idx && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF69B4] text-white shadow-xs">
                      メイン
                    </span>
                  )}

                  {/* Action overlays on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                    {primaryImageIndex !== idx && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImageIndex(idx)}
                        className="px-2.5 py-1 bg-white text-[#1A1A1A] rounded-full text-[10px] font-bold hover:bg-[#FFF0F5]"
                      >
                        メインにする
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newImgs = images.filter((_, i) => i !== idx);
                        setImages(newImgs);
                        if (primaryImageIndex >= newImgs.length) {
                          setPrimaryImageIndex(Math.max(0, newImgs.length - 1));
                        }
                      }}
                      className="p-1.5 bg-rose-600 text-white rounded-full text-[10px] hover:bg-rose-700"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add image dropzone card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#FFD1DC] hover:border-[#FF69B4] rounded-2xl aspect-square flex flex-col items-center justify-center text-stone-400 hover:text-[#FF69B4] bg-white hover:bg-[#FFF0F5] cursor-pointer transition-colors p-2 text-center"
              >
                <Upload className="w-5 h-5 mb-1 text-stone-400" />
                <span className="text-[11px] font-bold">写真を追加</span>
              </div>
            </div>

            {/* Quick preset kawaii photos selector */}
            <div className="mt-3.5 pt-3 border-t border-[#FFD1DC]/60">
              <div className="text-[11px] text-stone-500 font-bold mb-2 flex items-center gap-1">
                <span>🌸 サンホ定番プリセット写真から選択:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SAMPLE_PHOTOS.slice(0, 6).map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setImages((prev) => [...prev, preset.url]);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white border border-[#FFD1DC] text-[#4A4A4A] hover:border-[#FF69B4] hover:text-[#FF69B4] hover:bg-[#FFF0F5] transition-colors shadow-2xs"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Product Identifiers & Barcode */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-[#FF69B4]" />
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                商品コード & バーコード（JANコード）
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Product Name */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  商品名 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-product-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ほっぺちゃん いちごホイップチャーム"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-bold text-[#1A1A1A]"
                />
              </div>

              {/* Category */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  カテゴリー <span className="text-rose-500">*</span>
                </label>
                <select
                  id="form-product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-bold text-[#1A1A1A]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  自社SKU / 管理品番
                </label>
                <input
                  id="form-product-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="例: HOP-001-PK"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-mono text-[#1A1A1A]"
                />
              </div>

              {/* JAN / Barcode with Generator */}
              <div className="md:col-span-8">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#4A4A4A]">
                    バーコード（JAN-13 または Code128） <span className="text-rose-500">*</span>
                  </label>
                  <button
                    id="generate-jan-btn"
                    type="button"
                    onClick={() => {
                      const newJan = generateRandomJanCode();
                      setJanCode(newJan);
                    }}
                    className="text-[11px] font-bold text-[#FF69B4] hover:text-[#ff3b94] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>新規JAN-13自動採番</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    id="form-product-jan"
                    type="text"
                    required
                    value={janCode}
                    onChange={(e) => setJanCode(e.target.value)}
                    placeholder="4589990000000"
                    className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-mono font-bold text-[#1A1A1A] tracking-wider"
                  />
                </div>
              </div>

              {/* Live SVG Barcode Display */}
              {barcodeSvg && (
                <div className="md:col-span-12 bg-white p-3.5 rounded-2xl border border-[#FFD1DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-stone-400 uppercase">
                      バーコードプレビュー:
                    </span>
                    <div
                      className="bg-white p-1 rounded-lg border border-[#FFD1DC]/60"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    スキャナー即時読み取り可能
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Pricing & Inventory */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[#FF69B4]" />
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                価格・在庫・保管場所
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Retail Price */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  販売価格 (税込)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#FF69B4]">
                    ¥
                  </span>
                  <input
                    id="form-product-price"
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-black text-[#FF69B4]"
                  />
                </div>
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  仕入原価 (税抜)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    ¥
                  </span>
                  <input
                    id="form-product-cost"
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-bold text-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  現在庫数
                </label>
                <input
                  id="form-product-stock"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-black text-[#1A1A1A]"
                />
              </div>

              {/* Min Stock Alert */}
              <div>
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  適正発注点 (警告閾値)
                </label>
                <input
                  id="form-product-threshold"
                  type="number"
                  min="0"
                  value={minStockThreshold}
                  onChange={(e) => setMinStockThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-bold text-[#1A1A1A]"
                />
              </div>

              {/* Shelf Location */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  保管場所・棚番号 (ロケーション)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#FF69B4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="form-product-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="例: A-01-2 (1階 アクセサリー棚)"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Supplier */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                  仕入先・取引先名
                </label>
                <input
                  id="form-product-supplier"
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="例: サン宝石オリジナル企画"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Description, AI Catchphrase & Tags */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF69B4]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  商品説明 & サンホ風キャッチコピー
                </h3>
              </div>

              <button
                id="ai-generate-copy-btn"
                type="button"
                onClick={handleGenerateAiCopy}
                disabled={isAiGenerating}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FF69B4] hover:bg-[#ff52a5] text-white rounded-full text-xs font-bold shadow-md shadow-pink-200 transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'AI生成中...' : '✨ AIで商品コピー・タグ生成'}</span>
              </button>
            </div>

            {/* Catchphrase */}
            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                キャッチコピー（店頭POP・WEB掲載用）
              </label>
              <input
                id="form-product-catchphrase"
                type="text"
                value={catchphrase}
                onChange={(e) => setCatchphrase(e.target.value)}
                placeholder="例: ぷにぷにほっぺが超キュート♡大人気限定チャーム"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-bold text-[#FF69B4]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                商品説明・仕様メモ
              </label>
              <textarea
                id="form-product-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="サイズ、素材、セット内容、セールスポイントなど..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] mb-1">
                検索タグ・属性
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="hover:text-rose-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  id="form-product-tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="タグを入力してEnter..."
                  className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#FFD1DC] rounded-full focus:border-[#FF69B4] outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] border border-[#FFD1DC] rounded-full text-xs font-bold transition-colors"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-t border-[#FFD1DC] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold text-xs border border-[#FFD1DC] transition-colors shadow-2xs"
          >
            キャンセル
          </button>
          <button
            type="submit"
            form="product-registration-form"
            className="px-6 py-2.5 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-bold text-xs shadow-md shadow-pink-200 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{initialProduct ? '更新を保存する' : '商品台帳に登録する'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
