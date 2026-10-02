import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  Trash2,
  ArrowRightLeft,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Product, TransactionType } from '../types';

interface StockInOutModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    productId: string,
    delta: number,
    type: TransactionType,
    reason: string,
    operator: string
  ) => void;
}

export const StockInOutModal: React.FC<StockInOutModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [type, setType] = useState<TransactionType>('in');
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('仕入入荷・入庫');
  const [operator, setOperator] = useState<string>('担当者');

  if (!isOpen || !product) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'in') setReason('仕入入荷・入庫');
    else if (newType === 'out') setReason('店舗出荷・通信販売売上');
    else if (newType === 'audit') setReason('定期棚卸による実数修正');
    else if (newType === 'discard') setReason('破損・初期不良廃棄');
    else if (newType === 'move') setReason('店舗間移動・棚移動');
  };

  const calculatedNewStock = () => {
    if (type === 'in') return product.stockQuantity + amount;
    if (type === 'out' || type === 'discard')
      return Math.max(0, product.stockQuantity - amount);
    if (type === 'audit') return amount; // direct override
    return product.stockQuantity;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 && type !== 'audit') {
      alert('数量は1以上を指定してください。');
      return;
    }

    let delta = amount;
    if (type === 'out' || type === 'discard') {
      delta = -amount;
    } else if (type === 'audit') {
      delta = amount - product.stockQuantity;
    }

    onConfirm(product.id, delta, type, reason, operator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black">在庫変動・入出庫処理</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product summary header */}
        <div className="bg-[#FFF5F7] p-4 border-b border-[#FFD1DC] flex items-center gap-3">
          {product.images && product.images.length > 0 && (
            <img
              src={product.images[product.primaryImageIndex || 0]}
              alt={product.name}
              className="w-12 h-12 rounded-2xl object-cover border border-[#FFD1DC] shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-[#1A1A1A] truncate">
              {product.name}
            </div>
            <div className="text-[11px] font-mono text-stone-400">
              JAN: {product.janCode}
            </div>
            <div className="text-xs text-[#4A4A4A] mt-0.5 font-bold">
              現在庫:{' '}
              <strong className="text-[#FF69B4] font-black">
                {product.stockQuantity}個
              </strong>{' '}
              <span className="font-normal text-stone-400">(棚番: {product.location || '未設定'})</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Movement Type Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-2">
              処理種別
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('in')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                  type === 'in'
                    ? 'bg-[#FFF0F5] border-[#FF69B4] text-[#FF69B4] ring-2 ring-pink-200'
                    : 'bg-white border-[#FFD1DC] text-[#4A4A4A] hover:bg-[#FFF5F7]'
                }`}
              >
                <PackagePlus className="w-4 h-4 text-emerald-600" />
                <span>入庫 (+)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('out')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                  type === 'out'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200'
                    : 'bg-white border-[#FFD1DC] text-[#4A4A4A] hover:bg-[#FFF5F7]'
                }`}
              >
                <PackageMinus className="w-4 h-4 text-rose-600" />
                <span>出庫・販売 (-)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('audit')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                  type === 'audit'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-200'
                    : 'bg-white border-[#FFD1DC] text-[#4A4A4A] hover:bg-[#FFF5F7]'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>棚卸実数修正</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
              {type === 'audit' ? '実棚卸カウント数（確定実数）' : '変動数量'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={type === 'audit' ? '0' : '1'}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] focus:ring-2 focus:ring-pink-200 outline-none font-black text-[#1A1A1A]"
              />
              <span className="text-xs font-bold text-stone-500">個</span>
            </div>

            {/* Quick batch presets */}
            <div className="flex gap-1.5 mt-2">
              {[5, 10, 20, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(n)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] font-bold border border-[#FFD1DC] transition-colors"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* Forecasted New Stock */}
          <div className="bg-[#FFF5F7] p-3 rounded-2xl border border-[#FFD1DC] flex items-center justify-between text-xs">
            <span className="text-stone-500 font-bold">
              処理後の見込み在庫:
            </span>
            <span className="text-sm font-black text-[#FF69B4]">
              {calculatedNewStock()} 個
            </span>
          </div>

          {/* Reason memo */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
              理由・備考メモ
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: 発注便入荷（山梨倉庫より）"
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] outline-none"
            />
          </div>

          {/* Operator name */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
              担当者名
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="担当者"
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#FFD1DC] rounded-2xl focus:border-[#FF69B4] outline-none font-bold"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold text-xs border border-[#FFD1DC] transition-colors shadow-2xs"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-bold text-xs shadow-md shadow-pink-200 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>確定して在庫を更新</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
