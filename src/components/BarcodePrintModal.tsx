import React, { useState } from 'react';
import {
  X,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  FileText,
  Tag,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Product, LabelTemplate } from '../types';
import { renderBarcodeToSvg } from '../utils/barcode';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialSelectedProductId?: string;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  products,
  initialSelectedProductId,
}) => {
  const [template, setTemplate] = useState<LabelTemplate>('standard_tag');
  const [showPhoto, setShowPhoto] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showJanCodeText, setShowJanCodeText] = useState(true);
  const [showCatchphrase, setShowCatchphrase] = useState(false);

  // Selected products & quantities
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = p.id === initialSelectedProductId ? 5 : 0;
    });
    // If no initial product selected, select all with 2
    if (!initialSelectedProductId) {
      products.slice(0, 4).forEach((p) => {
        map[p.id] = 2;
      });
    }
    return map;
  });

  if (!isOpen) return null;

  const handleSelectAll = (qty: number) => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = qty;
    });
    setQuantities(map);
  };

  const handleQuantityChange = (id: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, val),
    }));
  };

  // Compile list of cards to print
  const itemsToPrint: { product: Product; index: number }[] = [];
  products.forEach((p) => {
    const count = quantities[p.id] || 0;
    for (let i = 0; i < count; i++) {
      itemsToPrint.push({ product: p, index: i });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-[#FFD1DC]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-b border-[#FFD1DC] text-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF69B4] text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">
                バーコード値札・商品ラベル印刷
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                店頭プライスタグ・棚札シール・アクセサリータグの一括印刷
              </p>
            </div>
          </div>
          <button
            id="close-print-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-[#1A1A1A] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Settings + Live Print Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Settings & Product Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Label Template Selection */}
            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-2.5">
                ラベル様式 (テンプレート)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'standard_tag',
                    name: '標準値札タグ',
                    desc: '写真・価格・JAN付',
                  },
                  {
                    id: 'compact_sticker',
                    name: 'バーコードシール',
                    desc: '省スペース貼付用',
                  },
                  {
                    id: 'shelf_label',
                    name: '棚札・ロケーション',
                    desc: '棚番・在庫数管理',
                  },
                  {
                    id: 'mini_jewelry',
                    name: 'ミニアクセ用タグ',
                    desc: 'リング・ピン等小型',
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as LabelTemplate)}
                    className={`p-2.5 rounded-2xl text-left text-xs transition-all border ${
                      template === t.id
                        ? 'bg-[#FFF0F5] border-[#FF69B4] text-[#FF69B4] font-bold shadow-2xs'
                        : 'bg-white border-[#FFD1DC] text-[#4A4A4A] hover:bg-[#FFF0F5]'
                    }`}
                  >
                    <div className="font-bold">{t.name}</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Elements Toggles */}
            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-2.5">
                印字項目のカスタマイズ
              </label>
              <div className="space-y-2 text-xs text-[#4A4A4A] font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPhoto}
                    onChange={(e) => setShowPhoto(e.target.checked)}
                    className="rounded text-[#FF69B4] focus:ring-pink-400 accent-[#FF69B4]"
                  />
                  <span>商品写真を表示</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-[#FF69B4] focus:ring-pink-400 accent-[#FF69B4]"
                  />
                  <span>税込販売価格を表示 (¥価格)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded text-[#FF69B4] focus:ring-pink-400 accent-[#FF69B4]"
                  />
                  <span>棚番号 (ロケーション) を表示</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showJanCodeText}
                    onChange={(e) => setShowJanCodeText(e.target.checked)}
                    className="rounded text-[#FF69B4] focus:ring-pink-400 accent-[#FF69B4]"
                  />
                  <span>バーコード数字 (JAN-13) を印字</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCatchphrase}
                    onChange={(e) => setShowCatchphrase(e.target.checked)}
                    className="rounded text-[#FF69B4] focus:ring-pink-400 accent-[#FF69B4]"
                  />
                  <span>POP用キャッチコピーを表示</span>
                </label>
              </div>
            </div>

            {/* Product Selection List & Quantities */}
            <div className="bg-[#FFF5F7] p-4 rounded-3xl border border-[#FFD1DC]">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-[#1A1A1A]">
                  印刷対象と枚数指定
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(2)}
                    className="text-[#FF69B4] hover:text-[#ff3b94] font-bold"
                  >
                    全品2枚
                  </button>
                  <span className="text-[#FFD1DC]">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(0)}
                    className="text-stone-400 hover:text-stone-600 font-bold"
                  >
                    解除
                  </button>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {products.map((p) => {
                  const qty = quantities[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                        qty > 0
                          ? 'bg-white border-[#FF69B4] shadow-2xs'
                          : 'bg-[#FFF0F5]/50 border-[#FFD1DC] text-stone-400'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#1A1A1A] truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-stone-400">
                          {p.janCode} · ¥{p.price}
                        </div>
                      </div>

                      {/* Quantity input */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(p.id, qty - 1)}
                          className="w-6 h-6 rounded-full bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] flex items-center justify-center font-bold border border-[#FFD1DC]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={qty}
                          onChange={(e) =>
                            handleQuantityChange(p.id, Number(e.target.value))
                          }
                          className="w-10 text-center py-0.5 text-xs bg-white border border-[#FFD1DC] rounded-lg font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(p.id, qty + 1)}
                          className="w-6 h-6 rounded-full bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] flex items-center justify-center font-bold border border-[#FFD1DC]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Live Print Preview (8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-[#FFF5F7] p-5 rounded-3xl border border-[#FFD1DC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#FFD1DC] mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  印刷プレビュー ({itemsToPrint.length}枚のラベル)
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-bold">
                A4用紙 / ラベルプリンター自動最適化
              </span>
            </div>

            {/* Printable Sheet View Container */}
            <div
              id="printable-barcode-sheet"
              className="flex-1 bg-white p-5 rounded-2xl shadow-xs border border-[#FFD1DC] overflow-y-auto max-h-[500px]"
            >
              {itemsToPrint.length === 0 ? (
                <div className="py-16 text-center text-stone-400">
                  <Printer className="w-12 h-12 mx-auto text-[#FFD1DC] mb-2" />
                  <p className="text-xs font-bold text-stone-500">
                    左側のリストから印刷したい商品の枚数を指定してください
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
                  {itemsToPrint.map((item, idx) => {
                    const p = item.product;
                    const barcodeSvg = renderBarcodeToSvg(p.janCode, {
                      height: 32,
                      width: 1.4,
                      fontSize: 10,
                      displayValue: showJanCodeText,
                      margin: 2,
                    });

                    // Render card according to template
                    if (template === 'shelf_label') {
                      return (
                        <div
                          key={`${p.id}-${idx}`}
                          className="border-2 border-[#1A1A1A] rounded-2xl p-3 bg-white text-[#1A1A1A] flex flex-col justify-between aspect-[1.6/1] shadow-2xs print:shadow-none break-inside-avoid"
                        >
                          <div className="flex items-center justify-between border-b border-[#FFD1DC] pb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF69B4] text-white px-2 py-0.5 rounded-full">
                              棚: {p.location || 'A-01'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-stone-600">
                              {p.sku}
                            </span>
                          </div>
                          <div className="font-black text-xs line-clamp-1 my-1">
                            {p.name}
                          </div>
                          <div className="flex items-center justify-between">
                            <div
                              className="scale-90 origin-left"
                              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                            />
                            <div className="text-right">
                              <span className="text-[9px] text-stone-500 font-bold">
                                基準在庫
                              </span>
                              <div className="text-xs font-black">
                                {p.stockQuantity}個
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (template === 'mini_jewelry') {
                      return (
                        <div
                          key={`${p.id}-${idx}`}
                          className="border border-dashed border-[#FFD1DC] rounded-xl p-2 bg-white text-[#1A1A1A] flex flex-col justify-between text-[10px] aspect-[2/1] shadow-2xs print:shadow-none break-inside-avoid"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="truncate max-w-[100px] font-black">
                              {p.name}
                            </span>
                            <span className="text-[#FF69B4] font-black">
                              ¥{p.price}
                            </span>
                          </div>
                          <div
                            className="scale-75 origin-center my-0.5"
                            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                          />
                          <div className="text-[8px] font-mono text-stone-400 text-center font-bold">
                            サン宝石 · {p.janCode}
                          </div>
                        </div>
                      );
                    }

                    // Default Standard Tag
                    return (
                      <div
                        key={`${p.id}-${idx}`}
                        className="border border-[#FFD1DC] rounded-2xl p-3 bg-white text-[#1A1A1A] flex flex-col justify-between shadow-2xs print:shadow-none hover:border-[#FF69B4] transition-colors break-inside-avoid"
                      >
                        {/* Brand header */}
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#FFD1DC]">
                          <span className="text-[10px] font-black text-[#FF69B4] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#FF69B4]" />
                            サン宝石
                          </span>
                          {showLocation && p.location && (
                            <span className="text-[9px] font-mono bg-[#FFF0F5] px-1.5 py-0.5 rounded-full text-[#FF69B4] border border-[#FFD1DC] font-bold">
                              棚: {p.location}
                            </span>
                          )}
                        </div>

                        {/* Middle photo & Name */}
                        <div className="flex gap-2 items-center my-1">
                          {showPhoto && p.images && p.images.length > 0 && (
                            <img
                              src={p.images[p.primaryImageIndex || 0]}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-xl border border-[#FFD1DC] shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-black text-[#1A1A1A] line-clamp-2 leading-tight">
                              {p.name}
                            </div>
                            {showCatchphrase && p.catchphrase && (
                              <div className="text-[9px] text-[#FF69B4] font-bold truncate mt-0.5">
                                {p.catchphrase}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price highlight */}
                        {showPrice && (
                          <div className="flex items-baseline justify-between bg-[#FFF0F5] px-2.5 py-1 rounded-xl my-1 border border-[#FFD1DC]/60">
                            <span className="text-[9px] text-[#FF69B4] font-bold">
                              税込価格
                            </span>
                            <span className="text-sm font-black text-[#FF69B4]">
                              ¥{p.price.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Barcode */}
                        <div
                          className="w-full flex justify-center mt-1 overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FFF0F5] border-t border-[#FFD1DC] flex items-center justify-between">
          <div className="text-xs text-[#4A4A4A] font-bold">
            印刷予定枚数:{' '}
            <strong className="text-[#FF69B4] font-black text-sm">
              {itemsToPrint.length}
            </strong>{' '}
            枚
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-white hover:bg-stone-100 text-[#4A4A4A] font-bold text-xs border border-[#FFD1DC] shadow-2xs transition-colors"
            >
              閉じる
            </button>
            <button
              id="execute-print-btn"
              type="button"
              onClick={handlePrint}
              disabled={itemsToPrint.length === 0}
              className="px-6 py-2.5 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-bold text-xs shadow-md shadow-pink-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>プリンターで印刷 (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
