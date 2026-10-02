import React from 'react';
import {
  X,
  BarChart3,
  AlertTriangle,
  Package,
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  ArrowRight,
  PackagePlus,
} from 'lucide-react';
import { Product } from '../types';

interface AnalyticsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onOpenStockAdjust: (p: Product) => void;
}

export const AnalyticsOverviewModal: React.FC<AnalyticsOverviewModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onOpenStockAdjust,
}) => {
  if (!isOpen) return null;

  const totalSkus = products.length;
  const totalStockUnits = products.reduce(
    (sum, p) => sum + (p.stockQuantity || 0),
    0
  );
  const totalRetailValue = products.reduce(
    (sum, p) => sum + (p.stockQuantity || 0) * (p.price || 0),
    0
  );
  const totalCostValue = products.reduce(
    (sum, p) => sum + (p.stockQuantity || 0) * (p.costPrice || 0),
    0
  );

  const lowStockItems = products.filter(
    (p) => p.stockQuantity <= p.minStockThreshold
  );

  // Group by category
  const categoryStats: Record<string, { count: number; stock: number; value: number }> =
    {};
  products.forEach((p) => {
    const cat = p.category || 'その他';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, stock: 0, value: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].stock += p.stockQuantity || 0;
    categoryStats[cat].value += (p.stockQuantity || 0) * (p.price || 0);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">在庫集計 & 発注アラート</h2>
              <p className="text-xs text-stone-500 font-medium">
                サン宝石商材の在庫総額・カテゴリー内訳・発注必要品
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5 mb-1">
                <Layers className="w-4 h-4 text-[#FF69B4]" />
                登録アイテム数
              </div>
              <div className="text-2xl font-black text-[#1A1A1A]">
                {totalSkus}{' '}
                <span className="text-xs font-bold text-stone-400">品目</span>
              </div>
            </div>

            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5 mb-1">
                <Package className="w-4 h-4 text-[#FF69B4]" />
                総在庫点数
              </div>
              <div className="text-2xl font-black text-[#1A1A1A]">
                {totalStockUnits.toLocaleString()}{' '}
                <span className="text-xs font-bold text-stone-400">個</span>
              </div>
            </div>

            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
              <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                在庫資産総額 (売価)
              </div>
              <div className="text-2xl font-black text-[#FF69B4]">
                ¥{totalRetailValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-bold">
                原価総額: ¥{totalCostValue.toLocaleString()}
              </div>
            </div>

            <div
              className={`p-4 rounded-3xl border ${
                lowStockItems.length > 0
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                要発注アイテム
              </div>
              <div className="text-2xl font-black">
                {lowStockItems.length}{' '}
                <span className="text-xs font-bold opacity-80">品目</span>
              </div>
              <div className="text-[11px] opacity-80 mt-0.5 font-bold">
                基準在庫を下回っている商材
              </div>
            </div>
          </div>

          {/* Low Stock Items Action List */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50/40 p-5 rounded-3xl border border-amber-200">
              <h3 className="text-xs font-black text-amber-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                発注・補充が必要な商材（{lowStockItems.length}件）
              </h3>

              <div className="space-y-2.5">
                {lowStockItems.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.images && p.images.length > 0 && (
                        <img
                          src={p.images[p.primaryImageIndex || 0]}
                          alt={p.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-amber-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#1A1A1A] truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono font-bold">
                          JAN: {p.janCode} · 棚番: {p.location} · 仕入先: {p.supplier || 'サンホ'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-600">
                          残 {p.stockQuantity}個
                        </span>
                        <div className="text-[10px] text-stone-400 font-bold">
                          (発注点: {p.minStockThreshold}個)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenStockAdjust(p);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>発注・入庫</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <h3 className="text-xs font-bold text-[#1A1A1A] mb-3.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF69B4]" />
              カテゴリー別 在庫・商品構成
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(categoryStats).map(([cat, stat]) => (
                <div
                  key={cat}
                  className="bg-white p-3.5 rounded-2xl border border-[#FFD1DC] shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-[#1A1A1A]">
                      {cat}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC]">
                      {stat.count}品目
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs mt-2">
                    <span className="text-stone-400 text-[11px] font-bold">在庫総数</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {stat.stock}個
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs mt-0.5">
                    <span className="text-stone-400 text-[11px] font-bold">在庫売価</span>
                    <span className="font-black text-[#FF69B4]">
                      ¥{stat.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-t border-[#FFD1DC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold text-xs border border-[#FFD1DC] shadow-2xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
