import React from 'react';
import {
  PackagePlus,
  PackageMinus,
  MapPin,
  Printer,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../types';
import { renderBarcodeToSvg } from '../utils/barcode';

interface ProductTableViewProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onStockQuickAdjust: (p: Product, delta: number) => void;
  onOpenPrint: (productId: string) => void;
  selectedIds?: string[];
  onToggleSelect?: (productId: string) => void;
  onToggleSelectAll?: () => void;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  onSelectProduct,
  onEdit,
  onDelete,
  onStockQuickAdjust,
  onOpenPrint,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const isAllSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));
  const isSomeSelected = products.some((p) => selectedIds.includes(p.id)) && !isAllSelected;

  return (
    <div className="bg-white rounded-3xl border border-[#FFD1DC] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#4A4A4A] font-bold">
              {onToggleSelect && (
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={onToggleSelectAll}
                    title="全選択 / 全解除"
                    className="w-4 h-4 rounded text-[#FF69B4] focus:ring-[#FF69B4] cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3 px-3 w-16 text-center">写真</th>
              <th className="py-3 px-3">商品名 / SKU</th>
              <th className="py-3 px-3">カテゴリー</th>
              <th className="py-3 px-3">JANコード / バーコード</th>
              <th className="py-3 px-3 text-right">価格 (税込)</th>
              <th className="py-3 px-3 text-center">棚番</th>
              <th className="py-3 px-3 text-center">現在庫数</th>
              <th className="py-3 px-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FFD1DC]/40">
            {products.map((p) => {
              const isLowStock = p.stockQuantity <= p.minStockThreshold;
              const isSelected = selectedIds.includes(p.id);
              const currentImage =
                p.images && p.images.length > 0
                  ? p.images[p.primaryImageIndex || 0] || p.images[0]
                  : null;

              const barcodeSvg = renderBarcodeToSvg(p.janCode, {
                height: 24,
                width: 1.2,
                fontSize: 9,
                displayValue: false,
                margin: 0,
              });

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className={`hover:bg-[#FFF5F7] cursor-pointer transition-colors ${
                    isSelected ? 'bg-pink-50/40' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  {onToggleSelect && (
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(p.id)}
                        className="w-4 h-4 rounded text-[#FF69B4] focus:ring-[#FF69B4] cursor-pointer"
                      />
                    </td>
                  )}

                  {/* Photo */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF5F7] border border-[#FFD1DC] overflow-hidden mx-auto">
                      {currentImage ? (
                        <img
                          src={currentImage}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-300">
                          なし
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Name & SKU */}
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-[#1A1A1A] line-clamp-1 max-w-xs">
                      {p.name}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                      SKU: {p.sku}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC]">
                      {p.category}
                    </span>
                  </td>

                  {/* JAN Code + Barcode mini */}
                  <td className="py-2.5 px-3">
                    <div className="font-mono text-[#1A1A1A] font-bold text-[11px]">
                      {p.janCode}
                    </div>
                    <div
                      className="overflow-hidden max-w-[100px] mt-0.5"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                  </td>

                  {/* Price */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span className="font-black text-[#FF69B4]">
                      ¥{p.price.toLocaleString()}
                    </span>
                  </td>

                  {/* Shelf Location */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-[#FFF0F5] px-2.5 py-0.5 rounded-full text-[#4A4A4A] border border-[#FFD1DC]">
                      {p.location || '-'}
                    </span>
                  </td>

                  {/* Stock Quantity */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div
                      className="inline-flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onStockQuickAdjust(p, -1)}
                        disabled={p.stockQuantity <= 0}
                        className="w-6 h-6 rounded-full bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] hover:text-[#FF69B4] border border-[#FFD1DC] font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
                      >
                        -
                      </button>

                      <span
                        className={`font-black text-sm min-w-[32px] ${
                          isLowStock ? 'text-[#C62828]' : 'text-[#1A1A1A]'
                        }`}
                      >
                        {p.stockQuantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => onStockQuickAdjust(p, 1)}
                        className="w-6 h-6 rounded-full bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] hover:text-[#FF69B4] border border-[#FFD1DC] font-bold flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {isLowStock && (
                      <div className="text-[10px] text-[#C62828] font-bold mt-0.5">
                        要発注
                      </div>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200 animate-in fade-in">
                          <span className="text-[10px] text-rose-700 font-bold px-1">削除?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(p.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg shadow-2xs cursor-pointer"
                          >
                            実行
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-white text-stone-500 hover:text-stone-800 text-[10px] rounded-lg border border-stone-200"
                          >
                            止める
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenPrint(p.id)}
                            className="p-1.5 text-stone-500 hover:text-[#FF69B4] hover:bg-[#FFF0F5] rounded-full transition-colors"
                            title="値札印刷"
                          >
                            <Printer className="w-4 h-4 text-[#FF69B4]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-stone-500 hover:text-[#1A1A1A] hover:bg-[#FFF0F5] rounded-full transition-colors"
                            title="編集"
                          >
                            <Edit className="w-4 h-4 text-stone-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4 text-stone-400 hover:text-rose-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
