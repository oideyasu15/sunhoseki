import React, { useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  Printer,
  Download,
  PackagePlus,
  PackageMinus,
  MapPin,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  AlertTriangle,
  History,
  Barcode,
  Calendar,
  Building,
} from 'lucide-react';
import { Product, StockTransaction } from '../types';
import { renderBarcodeToSvg, renderBarcodeToDataUrl } from '../utils/barcode';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onOpenStockAdjust: (product: Product) => void;
  onOpenPrintSingle: (productId: string) => void;
  transactions: StockTransaction[];
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onOpenStockAdjust,
  onOpenPrintSingle,
  transactions,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !product) return null;

  const handleDelete = () => {
    onDelete(product.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const currentImage =
    product.images && product.images.length > 0
      ? product.images[activeImageIndex] || product.images[0]
      : null;

  const barcodeSvg = renderBarcodeToSvg(product.janCode, {
    height: 50,
    width: 2,
    fontSize: 14,
  });

  const handleDownloadBarcode = () => {
    const dataUrl = renderBarcodeToDataUrl(product.janCode);
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `barcode_${product.sku || product.janCode}.png`;
    a.click();
  };

  const productTransactions = transactions
    .filter((t) => t.productId === product.id)
    .slice(0, 10);

  const profitMargin =
    product.price > 0
      ? Math.round(
          ((product.price - (product.costPrice || 0)) / product.price) * 100
        )
      : 0;

  const isLowStock = product.stockQuantity <= product.minStockThreshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#FF69B4] text-white shadow-xs">
              {product.category}
            </span>
            <h2 className="text-base font-black truncate max-w-md">
              {product.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="detail-edit-product-btn"
              type="button"
              onClick={() => {
                onEdit(product);
                onClose();
              }}
              className="p-2 rounded-full text-stone-500 hover:text-[#FF69B4] hover:bg-white transition-colors"
              title="編集"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              id="detail-delete-product-btn"
              type="button"
              onClick={() => setShowDeleteConfirm((prev) => !prev)}
              className={`p-2 rounded-full transition-colors ${
                showDeleteConfirm
                  ? 'bg-rose-500 text-white'
                  : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="商品を削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Modal Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2.5 text-xs text-rose-900 font-bold text-center sm:text-left">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                「<strong>{product.name}</strong>」を商品台帳から完全に削除しますか？（元に戻せません）
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                削除を実行する
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-600 text-xs font-bold rounded-full border border-stone-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Photos Gallery (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="rounded-3xl overflow-hidden bg-[#FFF5F7] border border-[#FFD1DC] aspect-square relative shadow-inner">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                    <span>写真が未登録です</span>
                  </div>
                )}

                {/* Catchphrase banner */}
                {product.catchphrase && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white text-xs font-bold leading-tight drop-shadow-sm">
                    ✨ {product.catchphrase}
                  </div>
                )}
              </div>

              {/* Photo Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === i
                          ? 'border-[#FF69B4] ring-2 ring-pink-200'
                          : 'border-[#FFD1DC] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumb ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Barcode Display & Actions */}
              <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1 font-bold text-[#1A1A1A]">
                    <Barcode className="w-4 h-4 text-[#FF69B4]" />
                    JAN / バーコード
                  </span>
                  <span className="font-mono text-stone-500">{product.janCode}</span>
                </div>

                <div
                  className="bg-white p-3 rounded-2xl border border-[#FFD1DC] flex justify-center shadow-xs"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadBarcode}
                    className="px-3 py-2 rounded-full bg-white border border-[#FFD1DC] hover:bg-[#FFF0F5] text-[#4A4A4A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>画像保存</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPrintSingle(product.id);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-pink-200"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>値札印刷</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Details & Inventory Status (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Title & SKU */}
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-400 font-mono mb-1">
                  <span>SKU: {product.sku}</span>
                  <span>·</span>
                  <span>JAN: {product.janCode}</span>
                </div>
                <h1 className="text-xl font-black text-[#1A1A1A] leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Stock Card with Quick Action */}
              <div
                className={`p-4.5 rounded-3xl border flex items-center justify-between ${
                  isLowStock
                    ? 'bg-[#FFEBEE] border-[#FFCDD2]'
                    : 'bg-[#E8F5E9]/60 border-[#C8E6C9]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isLowStock ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[#E53935]" />
                        <span className="text-[#C62828]">
                          要発注（基準在庫 {product.minStockThreshold}個以下）
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] inline-block" />
                        <span className="text-[#2E7D32]">適正在庫</span>
                      </>
                    )}
                  </div>
                  <div className="text-2xl font-black text-[#1A1A1A] mt-1 flex items-baseline gap-1">
                    {product.stockQuantity}
                    <span className="text-xs font-normal text-stone-500">
                      個
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onOpenStockAdjust(product);
                  }}
                  className="px-4 py-2.5 bg-[#FF69B4] hover:bg-[#ff52a5] text-white rounded-full text-xs font-bold shadow-md shadow-pink-200 transition-colors flex items-center gap-1.5"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>入出庫・在庫調整</span>
                </button>
              </div>

              {/* Price & Location Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#FFD1DC]">
                  <div className="text-[11px] text-stone-400 font-bold">
                    販売価格 (税込)
                  </div>
                  <div className="text-lg font-black text-[#FF69B4] mt-0.5">
                    ¥{product.price.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#FFD1DC]">
                  <div className="text-[11px] text-stone-400 font-bold">
                    仕入原価 (粗利率)
                  </div>
                  <div className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                    ¥{product.costPrice.toLocaleString()}{' '}
                    <span className="text-[11px] text-emerald-600 font-bold">
                      ({profitMargin}%)
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#FFD1DC]">
                  <div className="text-[11px] text-stone-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FF69B4]" />
                    棚番号・場所
                  </div>
                  <div className="text-sm font-bold text-[#1A1A1A] mt-0.5 truncate">
                    {product.location || '未設定'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
                <h3 className="text-xs font-bold text-[#1A1A1A] mb-1.5">
                  商品説明 & 特徴
                </h3>
                <p className="text-xs text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                  {product.description || '説明文は登録されていません。'}
                </p>
              </div>

              {/* Tags & Supplier */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-1">
                  {product.tags &&
                    product.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC] font-bold text-[11px]"
                      >
                        #{t}
                      </span>
                    ))}
                </div>

                {product.supplier && (
                  <div className="text-stone-400 text-[11px] flex items-center gap-1 font-medium">
                    <Building className="w-3 h-3" />
                    <span>仕入先: {product.supplier}</span>
                  </div>
                )}
              </div>

              {/* Recent Stock Movement History for this product */}
              <div className="border-t border-[#FFD1DC]/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-[#FF69B4]" />
                    この商品の直近の入出庫履歴
                  </span>
                </div>

                {productTransactions.length === 0 ? (
                  <p className="text-xs text-stone-400 py-1">
                    入出庫履歴はまだありません。
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {productTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2 rounded-2xl bg-[#FFF5F7] border border-[#FFD1DC] flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 font-mono">
                            {new Date(tx.timestamp).toLocaleDateString('ja-JP')}
                          </span>
                          <span className="font-bold text-[#1A1A1A]">
                            {tx.reason}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black ${
                              tx.quantityChanged > 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {tx.quantityChanged > 0 ? '+' : ''}
                            {tx.quantityChanged}
                          </span>
                          <span className="text-stone-400 font-mono">
                            (計 {tx.newStock}個)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FFF0F5] border-t border-[#FFD1DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>この商品を削除</span>
            </button>
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              | 登録日時: {new Date(product.createdAt).toLocaleString('ja-JP')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold text-xs border border-[#FFD1DC] transition-colors shadow-2xs cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
