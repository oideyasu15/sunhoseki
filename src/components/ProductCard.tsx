import React from 'react';
import {
  PackagePlus,
  PackageMinus,
  MapPin,
  Barcode,
  Printer,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import { renderBarcodeToSvg } from '../utils/barcode';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onStockQuickAdjust: (product: Product, delta: number) => void;
  onOpenPrint: (productId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (productId: string, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onStockQuickAdjust,
  onOpenPrint,
  isSelected = false,
  onToggleSelect,
}) => {
  const isLowStock = product.stockQuantity <= product.minStockThreshold;
  const isOutOfStock = product.stockQuantity === 0;

  const currentImage =
    product.images && product.images.length > 0
      ? product.images[product.primaryImageIndex || 0] || product.images[0]
      : null;

  const barcodeSvg = renderBarcodeToSvg(product.janCode, {
    height: 28,
    width: 1.3,
    fontSize: 9,
    displayValue: true,
    margin: 2,
  });

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-3xl border shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden cursor-pointer relative ${
        isSelected
          ? 'border-[#FF69B4] ring-2 ring-[#FF69B4]/30 shadow-md bg-pink-50/20'
          : 'border-[#FFD1DC] hover:border-[#FF69B4]'
      }`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] bg-[#FFF5F7] overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
            写真なし
          </div>
        )}

        {/* Selection Checkbox (Top-Left) */}
        {onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(product.id, e);
            }}
            title={isSelected ? '選択を解除' : '選択する'}
            className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-[#FF69B4] text-white shadow-md shadow-pink-300 ring-2 ring-white scale-105'
                : 'bg-white/90 text-transparent hover:text-stone-400 hover:bg-white border border-[#FFD1DC] shadow-xs'
            }`}
          >
            <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-50'}`} />
          </button>
        )}

        {/* Category Pill Tag */}
        <div className={`absolute top-2.5 flex items-center gap-1 ${onToggleSelect ? 'left-10' : 'left-2.5'}`}>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-[#FF69B4] shadow-xs border border-[#FFD1DC]">
            {product.category}
          </span>
        </div>

        {/* Stock Alert Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isOutOfStock ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] shadow-xs">
              在庫切れ
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] shadow-xs flex items-center gap-0.5 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-[#E53935]" />
              要補充
            </span>
          ) : null}
        </div>

        {/* Shelf location bottom chip */}
        {product.location && (
          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-900/80 text-white backdrop-blur-xs flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-pink-300" />
            <span>{product.location}</span>
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Catchphrase if present */}
          {product.catchphrase && (
            <div className="text-[11px] font-medium text-[#FF69B4] line-clamp-1 mb-1">
              ✨ {product.catchphrase}
            </div>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-bold text-[#1A1A1A] line-clamp-2 leading-snug group-hover:text-[#FF69B4] transition-colors">
            {product.name}
          </h3>

          {/* Price & SKU */}
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-base font-black text-[#FF69B4]">
              <span className="text-xs text-[#FF69B4] font-bold mr-0.5">¥</span>
              {product.price.toLocaleString()}
              <span className="text-[10px] text-stone-400 font-normal ml-1">
                (税込)
              </span>
            </div>
            <div className="text-[10px] font-mono text-stone-400">
              {product.sku}
            </div>
          </div>
        </div>

        {/* Barcode SVG representation */}
        <div className="pt-2 border-t border-[#FFD1DC]/50 flex items-center justify-between">
          <div
            className="overflow-hidden max-w-[130px]"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />

          {/* Stock Quick Editor & Print Trigger */}
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onStockQuickAdjust(product, -1)}
              disabled={product.stockQuantity <= 0}
              className="w-6 h-6 rounded-full bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] hover:text-[#FF69B4] border border-[#FFD1DC] font-black text-xs flex items-center justify-center disabled:opacity-30 transition-colors"
              title="在庫 -1"
            >
              -
            </button>

            <span
              className={`text-xs font-black min-w-[28px] text-center ${
                isLowStock ? 'text-[#C62828]' : 'text-[#1A1A1A]'
              }`}
            >
              {product.stockQuantity}
            </span>

            <button
              type="button"
              onClick={() => onStockQuickAdjust(product, 1)}
              className="w-6 h-6 rounded-full bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] hover:text-[#FF69B4] border border-[#FFD1DC] font-black text-xs flex items-center justify-center transition-colors"
              title="在庫 +1"
            >
              +
            </button>

            <button
              type="button"
              onClick={() => onOpenPrint(product.id)}
              className="p-1.5 rounded-full text-[#4A4A4A] hover:text-[#FF69B4] bg-[#FFF0F5] hover:bg-[#FFE4EC] border border-[#FFD1DC] transition-colors ml-0.5"
              title="値札ラベル印刷"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF69B4]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
