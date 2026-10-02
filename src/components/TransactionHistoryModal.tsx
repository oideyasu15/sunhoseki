import React, { useState } from 'react';
import {
  X,
  History,
  Download,
  Search,
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  Trash2,
  Filter,
} from 'lucide-react';
import { StockTransaction, TransactionType } from '../types';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StockTransaction[];
  onClearHistory: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.productName.toLowerCase().includes(q) ||
        t.janCode.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q) ||
        t.operator.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('エクスポートする履歴がありません。');
      return;
    }
    const headers = [
      'ID',
      '日時',
      '商品ID',
      '商品名',
      'JANコード',
      '処理種別',
      '変動数量',
      '処理前在庫',
      '処理後在庫',
      '理由・備考',
      '担当者',
    ];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${new Date(t.timestamp).toLocaleString('ja-JP')}"`,
      `"${t.productId}"`,
      `"${t.productName.replace(/"/g, '""')}"`,
      `"${t.janCode}"`,
      `"${
        t.type === 'in'
          ? '入庫'
          : t.type === 'out'
          ? '出庫'
          : t.type === 'audit'
          ? '棚卸'
          : '廃棄'
      }"`,
      t.quantityChanged,
      t.previousStock,
      t.newStock,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      `"${(t.operator || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunhoseki_stock_history_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">入出庫・棚卸履歴ログ</h2>
              <p className="text-xs text-stone-500 font-medium">
                バーコードスキャンや手動操作の全在庫変動履歴（{transactions.length}件）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="export-transaction-csv-btn"
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FFF5F7] text-[#4A4A4A] text-xs font-bold transition-colors border border-[#FFD1DC] shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#FF69B4]" />
              <span>CSV出力</span>
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

        {/* Filter Bar */}
        <div className="p-4 bg-[#FFF5F7] border-b border-[#FFD1DC] flex flex-wrap items-center justify-between gap-3">
          {/* Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <Filter className="w-3.5 h-3.5 text-stone-400 mr-1 shrink-0" />
            {[
              { id: 'all', label: 'すべて' },
              { id: 'in', label: '入庫 (+)' },
              { id: 'out', label: '出庫 (-)' },
              { id: 'audit', label: '棚卸調整' },
              { id: 'discard', label: '廃棄' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 ${
                  filterType === f.id
                    ? 'bg-[#FF69B4] text-white shadow-xs'
                    : 'bg-white border border-[#FFD1DC] text-[#4A4A4A] hover:bg-[#FFF0F5]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="商品名・JAN・理由で絞り込み..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#FFD1DC] rounded-full focus:border-[#FF69B4] outline-none"
            />
          </div>
        </div>

        {/* Table List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredTransactions.length === 0 ? (
            <div className="py-20 text-center text-stone-400">
              <History className="w-12 h-12 mx-auto text-[#FFD1DC] mb-2" />
              <p className="text-xs font-bold text-stone-500">
                該当する入出庫履歴はありません。
              </p>
            </div>
          ) : (
            <div className="border border-[#FFD1DC] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF5F7] border-b border-[#FFD1DC] text-[#4A4A4A] font-black">
                    <th className="py-3 px-3.5">日時</th>
                    <th className="py-3 px-3.5">種別</th>
                    <th className="py-3 px-3.5">商品名 / JANコード</th>
                    <th className="py-3 px-3.5 text-right">変動数量</th>
                    <th className="py-3 px-3.5 text-right">処理後在庫</th>
                    <th className="py-3 px-3.5">理由・メモ</th>
                    <th className="py-3 px-3.5">担当</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFD1DC]/60">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#FFF0F5]/40 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 text-stone-500 font-mono whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString('ja-JP')}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {tx.type === 'in' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            <PackagePlus className="w-3 h-3" />
                            入庫
                          </span>
                        )}
                        {tx.type === 'out' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            <PackageMinus className="w-3 h-3" />
                            出庫
                          </span>
                        )}
                        {tx.type === 'audit' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
                            <ClipboardCheck className="w-3 h-3" />
                            棚卸
                          </span>
                        )}
                        {tx.type === 'discard' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-stone-200 text-stone-700">
                            <Trash2 className="w-3 h-3" />
                            廃棄
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-[#1A1A1A] line-clamp-1">
                          {tx.productName}
                        </div>
                        <div className="text-[10px] font-mono text-stone-400 font-bold">
                          {tx.janCode}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-black">
                        <span
                          className={
                            tx.quantityChanged > 0
                              ? 'text-emerald-600'
                              : tx.quantityChanged < 0
                              ? 'text-rose-600'
                              : 'text-stone-600'
                          }
                        >
                          {tx.quantityChanged > 0 ? '+' : ''}
                          {tx.quantityChanged} 個
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-[#1A1A1A]">
                        {tx.newStock} 個
                      </td>
                      <td className="py-2.5 px-3.5 text-stone-600 max-w-xs truncate font-medium">
                        {tx.reason || '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-stone-500 whitespace-nowrap font-medium">
                        {tx.operator || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-t border-[#FFD1DC] flex items-center justify-between text-xs">
          {showClearConfirm ? (
            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
              <span className="text-[11px] text-rose-700 font-bold">全ログ消去?</span>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-full"
              >
                消去する
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="text-[10px] text-stone-500 hover:text-stone-700"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-stone-400 hover:text-rose-600 underline text-[11px] font-bold cursor-pointer"
            >
              ログを全消去
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold border border-[#FFD1DC] shadow-2xs transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
