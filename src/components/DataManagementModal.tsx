import React, { useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  if (!isOpen) return null;

  // Export Products to CSV
  const handleExportCsv = () => {
    const headers = [
      '商品ID',
      'SKU',
      'JANコード',
      '商品名',
      'カテゴリー',
      '販売価格税込',
      '仕入原価',
      '現在庫数',
      '発注点',
      '棚番ロケーション',
      'タグ',
      '商品説明',
      'キャッチコピー',
      '仕入先',
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.sku}"`,
      `"${p.janCode}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price,
      p.costPrice,
      p.stockQuantity,
      p.minStockThreshold,
      `"${p.location || ''}"`,
      `"${(p.tags || []).join(';')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${(p.catchphrase || '').replace(/"/g, '""')}"`,
      `"${p.supplier || ''}"`,
    ]);

    const csvString =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunhoseki_products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const jsonString = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunhoseki_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // Import CSV
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const text = loadEvent.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSVファイルにデータがありません。');
          return;
        }

        const newItems: Product[] = [];
        for (let i = 1; i < lines.length; i++) {
          // simple csv split handling quotes
          const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!match || match.length < 4) continue;

          const clean = (str: string) =>
            str.replace(/^"|"$/g, '').replace(/""/g, '"').trim();

          const name = clean(match[3] || '');
          const janCode = clean(match[2] || '');
          if (!name || !janCode) continue;

          newItems.push({
            id: clean(match[0]) || `sh-import-${Date.now()}-${i}`,
            sku: clean(match[1]) || `SKU-${i}`,
            janCode,
            name,
            category: (clean(match[4]) as any) || 'その他',
            price: Number(clean(match[5])) || 0,
            costPrice: Number(clean(match[6])) || 0,
            stockQuantity: Number(clean(match[7])) || 0,
            minStockThreshold: Number(clean(match[8])) || 5,
            location: clean(match[9]) || 'A-01-1',
            tags: clean(match[10]) ? clean(match[10]).split(';') : [],
            description: clean(match[11]) || '',
            catchphrase: clean(match[12]) || '',
            supplier: clean(match[13]) || 'サン宝石',
            images: [],
            primaryImageIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        if (newItems.length > 0) {
          onUpdateProducts([...products, ...newItems]);
          setStatusMessage({
            text: `CSVから${newItems.length}件の商品を追加しました。`,
            type: 'success',
          });
        }
      } catch (err) {
        setStatusMessage({
          text: 'CSVの解析に失敗しました。フォーマットを確認してください。',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(loadEvent.target?.result as string);
        if (Array.isArray(parsed)) {
          onUpdateProducts(parsed);
          setStatusMessage({
            text: `バックアップから${parsed.length}件の商品データを復元しました。`,
            type: 'success',
          });
        }
      } catch (err) {
        setStatusMessage({
          text: 'JSONファイルの読み込みに失敗しました。',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  // Reset to Sample Preset
  const handleResetSample = () => {
    onUpdateProducts(SAMPLE_PRODUCTS);
    setShowResetConfirm(false);
    setStatusMessage({
      text: 'サン宝石の初期サンプル商材データを再読み込みしました。',
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#FFD1DC]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">データ管理 & バックアップ</h2>
              <p className="text-xs text-stone-500 font-medium">
                CSV入出力・JSON保存・初期データ復元
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

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* CSV Section */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <h3 className="text-xs font-black text-[#1A1A1A] mb-1.5 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              CSV形式の入出力
            </h3>
            <p className="text-xs text-stone-500 font-medium mb-3.5 leading-relaxed">
              Excelやスプレッドシートで編集可能な商品台帳CSVをダウンロードまたは一括インポートします。
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex-1 py-2.5 px-3 bg-white border border-[#FFD1DC] hover:bg-[#FFF0F5] text-[#4A4A4A] rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4 text-[#FF69B4]" />
                <span>CSVエクスポート</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-[#FF69B4] hover:bg-[#ff52a5] text-white rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-pink-200"
              >
                <Upload className="w-4 h-4" />
                <span>CSVインポート</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCsv}
                className="hidden"
              />
            </div>
          </div>

          {/* JSON Backup */}
          <div className="bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <h3 className="text-xs font-black text-[#1A1A1A] mb-1.5 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#FF69B4]" />
              JSONバックアップ & 復元
            </h3>
            <p className="text-xs text-stone-500 font-medium mb-3.5 leading-relaxed">
              写真データを含めた完全なバックアップファイルを保存または復元します。
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 py-2.5 px-3 bg-white border border-[#FFD1DC] hover:bg-[#FFF0F5] text-[#4A4A4A] rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4 text-[#FF69B4]" />
                <span>JSON保存</span>
              </button>

              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-white border border-[#FFD1DC] hover:bg-[#FFF0F5] text-[#4A4A4A] rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-4 h-4 text-[#FF69B4]" />
                <span>JSON復元</span>
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset to Sunhoseki Sample */}
          <div className="bg-[#FFF0F5] p-5 rounded-3xl border border-[#FFD1DC]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-[#FF69B4] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF69B4]" />
                  サン宝石 サンプル商材を再読み込み
                </h3>
                <p className="text-[11px] text-[#4A4A4A] font-medium mt-0.5">
                  ほっぺちゃん、ヘアアクセ、ビーズ等のサンプルデータに戻します
                </p>
              </div>

              {showResetConfirm ? (
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#FFD1DC] shrink-0">
                  <span className="text-[11px] text-[#FF69B4] font-bold">復元しますか?</span>
                  <button
                    type="button"
                    onClick={handleResetSample}
                    className="px-3 py-1 bg-[#FF69B4] hover:bg-[#ff52a5] text-white text-[11px] font-bold rounded-full shadow-xs cursor-pointer"
                  >
                    実行
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 text-stone-500 text-[11px] hover:text-stone-800"
                  >
                    中止
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-white hover:bg-stone-50 text-[#FF69B4] border border-[#FFD1DC] rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>サンプル復帰</span>
                </button>
              )}
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
