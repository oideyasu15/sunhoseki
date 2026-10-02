import React, { useState } from 'react';
import {
  PackageMinus,
  PackagePlus,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  FileText,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Product, TransactionType } from '../types';

interface BatchStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onExecuteBatchStock: (
    adjustments: { productId: string; delta: number }[],
    type: TransactionType,
    reason: string,
    operator: string
  ) => void;
  onRemoveFromSelection: (productId: string) => void;
}

export const BatchStockModal: React.FC<BatchStockModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  onExecuteBatchStock,
  onRemoveFromSelection,
}) => {
  const [mode, setMode] = useState<'decrease' | 'increase'>('decrease');
  const [uniformQuantity, setUniformQuantity] = useState<number>(1);
  const [useIndividualAmounts, setUseIndividualAmounts] = useState<boolean>(false);
  const [individualQuantities, setIndividualQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<string>('催事・イベント販売');
  const [customReason, setCustomReason] = useState<string>('');
  const [operator, setOperator] = useState<string>('担当スタッフ');
  const [preventNegativeStock, setPreventNegativeStock] = useState<boolean>(true);

  if (!isOpen || selectedProducts.length === 0) return null;

  const decreasePresetReasons = [
    '催事・イベント販売',
    '店頭売上・レジ販売',
    '店舗・ポップアップ出荷',
    '福袋・セット組み出し',
    '棚卸差異・数量調整',
    '不良品・破損・サンプル廃棄',
    'その他 (自由入力)',
  ];

  const increasePresetReasons = [
    '仕入れ・工場入荷',
    '返品・キャンセル戻り',
    '催事・イベント戻り',
    '棚卸差異・数量調整',
    'その他 (自由入力)',
  ];

  const currentReasons = mode === 'decrease' ? decreasePresetReasons : increasePresetReasons;

  // Calculate actual delta per product
  const getProductDelta = (productId: string, currentStock: number) => {
    const rawQty = useIndividualAmounts
      ? individualQuantities[productId] ?? uniformQuantity
      : uniformQuantity;
    const qty = Math.max(1, Number(rawQty) || 1);

    if (mode === 'decrease') {
      if (preventNegativeStock) {
        // Can only decrease up to currentStock
        const actualDecrease = Math.min(currentStock, qty);
        return -actualDecrease;
      }
      return -qty;
    } else {
      return qty;
    }
  };

  const totalCalculatedItems = selectedProducts.reduce((sum, p) => {
    const delta = getProductDelta(p.id, p.stockQuantity);
    return sum + Math.abs(delta);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const adjustments = selectedProducts.map((p) => ({
      productId: p.id,
      delta: getProductDelta(p.id, p.stockQuantity),
    }));

    const finalReason = reason === 'その他 (自由入力)' ? customReason || '一括調整' : reason;
    const txType: TransactionType =
      mode === 'decrease'
        ? reason.includes('廃棄')
          ? 'discard'
          : 'out'
        : 'in';

    onExecuteBatchStock(adjustments, txType, finalReason, operator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#FFD1DC] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] to-white px-6 py-4 border-b border-[#FFD1DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                mode === 'decrease' ? 'bg-[#FF69B4]' : 'bg-emerald-500'
              }`}
            >
              {mode === 'decrease' ? (
                <PackageMinus className="w-5 h-5" />
              ) : (
                <PackagePlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-[#1A1A1A]">
                {mode === 'decrease' ? '選択商品の一括出庫・減少' : '選択商品の一括入庫・追加'}
              </h2>
              <p className="text-xs text-stone-500">
                選択中の <span className="font-bold text-[#FF69B4]">{selectedProducts.length}</span> 品目の在庫をまとめて更新します
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 bg-[#FFFBFD] border-b border-[#FFD1DC]/60 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('decrease');
              if (reason.includes('入荷') || reason.includes('戻り')) {
                setReason('催事・イベント販売');
              }
            }}
            className={`flex-1 py-2.5 rounded-t-2xl font-black text-xs flex items-center justify-center gap-2 border-t border-x transition-all ${
              mode === 'decrease'
                ? 'bg-white border-[#FFD1DC] text-[#FF69B4] shadow-xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <PackageMinus className="w-4 h-4" />
            <span>一括減少（出庫・販売・廃棄）</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('increase');
              if (reason.includes('販売') || reason.includes('出荷')) {
                setReason('仕入れ・工場入荷');
              }
            }}
            className={`flex-1 py-2.5 rounded-t-2xl font-black text-xs flex items-center justify-center gap-2 border-t border-x transition-all ${
              mode === 'increase'
                ? 'bg-white border-[#FFD1DC] text-emerald-600 shadow-xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>一括増加（入庫・仕入・戻り）</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quantity Setting Card */}
          <div className="bg-[#FFF5F7] rounded-2xl p-4.5 border border-[#FFD1DC] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#1A1A1A] flex items-center gap-1.5">
                <span>{mode === 'decrease' ? '減少させる数量' : '追加する数量'}</span>
                <span className="text-[10px] text-stone-400 font-normal">
                  （全品目一括または個別）
                </span>
              </label>

              <button
                type="button"
                onClick={() => setUseIndividualAmounts(!useIndividualAmounts)}
                className="text-[11px] font-bold text-[#FF69B4] hover:underline"
              >
                {useIndividualAmounts ? '一括同じ数量に戻す' : '品目ごとに数量を変える'}
              </button>
            </div>

            {!useIndividualAmounts ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white rounded-2xl border-2 border-[#FFD1DC] focus-within:border-[#FF69B4] p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setUniformQuantity(Math.max(1, uniformQuantity - 1))}
                      className="w-9 h-9 rounded-xl bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#FF69B4] font-black text-base flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={uniformQuantity}
                      onChange={(e) => setUniformQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-black text-lg text-[#1A1A1A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setUniformQuantity(uniformQuantity + 1)}
                      className="w-9 h-9 rounded-xl bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#FF69B4] font-black text-base flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-xs font-bold text-stone-600">
                    個 ずつ {mode === 'decrease' ? '減らす' : '増やす'}
                  </span>

                  {/* Preset quantity pills */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[1, 5, 10, 20, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setUniformQuantity(num)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          uniformQuantity === num
                            ? 'bg-[#FF69B4] text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-[#FFD1DC] hover:border-[#FF69B4]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                下の商品一覧で、各商品ごとに変更したい個数を入力してください。
              </p>
            )}

            {mode === 'decrease' && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preventNegativeStock}
                  onChange={(e) => setPreventNegativeStock(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF69B4] focus:ring-[#FF69B4]"
                />
                <span className="text-xs text-stone-600 font-medium">
                  現在庫数以上の減少時は<span className="font-bold text-[#FF69B4]">「0個」</span>でストップする（マイナス在庫を防ぐ）
                </span>
              </label>
            )}
          </div>

          {/* Selected Products List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
              <span>対象商品プレビュー ({selectedProducts.length} 件)</span>
              <span className="text-stone-400">
                合計変動数: <span className="text-[#FF69B4] font-black">{totalCalculatedItems}</span> 点
              </span>
            </div>

            <div className="border border-[#FFD1DC] rounded-2xl divide-y divide-[#FFD1DC]/40 max-h-56 overflow-y-auto bg-white">
              {selectedProducts.map((p) => {
                const delta = getProductDelta(p.id, p.stockQuantity);
                const projectedStock = Math.max(0, p.stockQuantity + delta);
                const currentImg = p.images?.[0];

                return (
                  <div
                    key={p.id}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#FFFBFD] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF5F7] border border-[#FFD1DC] overflow-hidden shrink-0">
                        {currentImg ? (
                          <img
                            src={currentImg}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-300">
                            なし
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1A1A1A] truncate max-w-[240px] sm:max-w-xs">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono flex items-center gap-2">
                          <span>JAN: {p.janCode}</span>
                          {p.location && <span>棚: {p.location}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {useIndividualAmounts && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400">数量:</span>
                          <input
                            type="number"
                            min={1}
                            value={individualQuantities[p.id] ?? uniformQuantity}
                            onChange={(e) =>
                              setIndividualQuantities({
                                ...individualQuantities,
                                [p.id]: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-14 px-1.5 py-1 text-center font-bold text-xs border border-[#FFD1DC] rounded-lg focus:border-[#FF69B4] outline-none"
                          />
                        </div>
                      )}

                      {/* Stock Change Preview */}
                      <div className="text-right text-xs">
                        <div className="font-mono text-stone-400">
                          {p.stockQuantity}個
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                          <ArrowRight className="w-3 h-3 text-stone-300" />
                          <span
                            className={`font-black ${
                              projectedStock === 0
                                ? 'text-rose-600'
                                : projectedStock <= p.minStockThreshold
                                ? 'text-amber-600'
                                : 'text-[#1A1A1A]'
                            }`}
                          >
                            {projectedStock}個
                          </span>
                          <span
                            className={`text-[10px] font-mono ${
                              delta < 0 ? 'text-rose-500' : 'text-emerald-600'
                            }`}
                          >
                            ({delta > 0 ? `+${delta}` : delta})
                          </span>
                        </div>
                      </div>

                      {/* Remove item from batch button */}
                      <button
                        type="button"
                        onClick={() => onRemoveFromSelection(p.id)}
                        className="p-1 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="この商品を選択から除外"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FF69B4]" />
                <span>{mode === 'decrease' ? '出庫・減少の理由' : '入庫・追加の理由'}</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#FFF5F7] border border-[#FFD1DC] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF69B4]"
              >
                {currentReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {reason === 'その他 (自由入力)' && (
                <input
                  type="text"
                  placeholder="理由を入力してください"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full mt-1.5 bg-white border border-[#FFD1DC] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#FF69B4]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF69B4]" />
                <span>担当者名</span>
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="担当スタッフ名"
                className="w-full bg-[#FFF5F7] border border-[#FFD1DC] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FF69B4]"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-[#FFD1DC] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-500 hover:bg-stone-100 transition-colors"
          >
            キャンセル
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-full text-xs font-black text-white shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] ${
              mode === 'decrease'
                ? 'bg-[#FF69B4] hover:bg-[#ff52a5] shadow-pink-200'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {mode === 'decrease'
                ? `${selectedProducts.length} 品目を一括出庫・減少する`
                : `${selectedProducts.length} 品目を一括入庫・追加する`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
