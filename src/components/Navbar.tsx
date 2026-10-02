import React from 'react';
import {
  Sparkles,
  QrCode,
  Plus,
  Printer,
  History,
  BarChart3,
  Search,
  Database,
  AlertTriangle,
  Users,
  RefreshCw,
  WifiOff,
  BookOpen,
} from 'lucide-react';
import { Product } from '../types';
import { SyncStatus } from '../services/api';

interface NavbarProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenScanner: () => void;
  onOpenNewProduct: () => void;
  onOpenPrint: () => void;
  onOpenHistory: () => void;
  onOpenAnalytics: () => void;
  onOpenDataManagement: () => void;
  onOpenManual?: () => void;
  lowStockCount: number;
  syncStatus?: SyncStatus;
  onManualSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenScanner,
  onOpenNewProduct,
  onOpenPrint,
  onOpenHistory,
  onOpenAnalytics,
  onOpenDataManagement,
  onOpenManual,
  lowStockCount,
  syncStatus = 'connected',
  onManualSync,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#FFD1DC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF69B4] flex items-center justify-center text-white shadow-md shadow-pink-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-[#1A1A1A] tracking-tight leading-none">
                  サン宝石
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC]">
                  バーコード商品管理
                </span>

                {/* Realtime Multi-user Sync status badge */}
                <button
                  type="button"
                  onClick={onManualSync}
                  title="リアルタイム共有同期中：誰でもブラウザや別端末から閲覧・更新が即時反映されます（クリックで手動再同期）"
                  className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {syncStatus === 'connected' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <Users className="w-3 h-3 text-emerald-600" />
                      <span>クラウド共有同期中</span>
                    </>
                  ) : syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      <span>同期中...</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-500" />
                      <span>オフライン（再接続中）</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
                Sunhoseki Barcode & Photo Inventory System (Shared Multi-User)
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="global-product-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="商品名・JANコード・棚番・タグで検索..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-[#FFF5F7] hover:bg-white focus:bg-white border border-[#FFD1DC] focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20 rounded-full outline-none transition-all placeholder:text-stone-400 font-medium"
              />
              {searchQuery && (
                <button
                  id="clear-search-button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 bg-stone-200/80 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Low stock indicator */}
            {lowStockCount > 0 && (
              <button
                id="low-stock-alert-btn"
                onClick={onOpenAnalytics}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs font-bold hover:bg-[#FFCDD2] transition-colors"
                title={`${lowStockCount}件の要発注商品があります`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#E53935] animate-bounce" />
                <span>要発注 {lowStockCount}件</span>
              </button>
            )}

            {/* Print Barcodes */}
            <button
              id="nav-print-tags-btn"
              onClick={onOpenPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#4A4A4A] bg-[#FFF0F5] hover:bg-[#FFE4EC] hover:text-[#FF69B4] rounded-full border border-[#FFD1DC]/60 transition-colors"
              title="バーコード値札・ラベル印刷"
            >
              <Printer className="w-4 h-4 text-[#FF69B4]" />
              <span className="hidden md:inline">値札印刷</span>
            </button>

            {/* Transaction history */}
            <button
              id="nav-history-btn"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#4A4A4A] bg-[#FFF0F5] hover:bg-[#FFE4EC] hover:text-[#FF69B4] rounded-full border border-[#FFD1DC]/60 transition-colors"
              title="入出庫履歴・棚卸ログ"
            >
              <History className="w-4 h-4 text-[#FF69B4]" />
              <span className="hidden md:inline">入出庫履歴</span>
            </button>

            {/* Analytics */}
            <button
              id="nav-analytics-btn"
              onClick={onOpenAnalytics}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#4A4A4A] bg-[#FFF0F5] hover:bg-[#FFE4EC] hover:text-[#FF69B4] rounded-full border border-[#FFD1DC]/60 transition-colors"
              title="在庫集計・分析"
            >
              <BarChart3 className="w-4 h-4 text-[#FF69B4]" />
              <span className="hidden md:inline">在庫集計</span>
            </button>

            {/* Data Management */}
            <button
              id="nav-data-btn"
              onClick={onOpenDataManagement}
              className="p-2 text-[#4A4A4A] hover:text-[#FF69B4] bg-[#FFF0F5] hover:bg-[#FFE4EC] rounded-full border border-[#FFD1DC]/60 transition-colors"
              title="CSV入出力・データバックアップ"
            >
              <Database className="w-4 h-4 text-[#FF69B4]" />
            </button>

            {/* Manual PDF Guide */}
            {onOpenManual && (
              <button
                id="nav-manual-btn"
                onClick={onOpenManual}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#FF69B4] bg-white hover:bg-[#FFF0F5] rounded-full border border-[#FFD1DC] shadow-2xs transition-colors"
                title="画像付き取扱説明書・PDF保存"
              >
                <BookOpen className="w-4 h-4 text-[#FF69B4]" />
                <span className="hidden xl:inline">説明書 (PDF)</span>
              </button>
            )}

            {/* Register New Product Button */}
            <button
              id="nav-add-product-btn"
              onClick={onOpenNewProduct}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-800 bg-[#FFF0F5] hover:bg-[#FFE4EC] hover:text-[#FF69B4] border border-[#FFD1DC] rounded-full shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4 text-[#FF69B4]" />
              <span className="hidden sm:inline">商品登録</span>
            </button>

            {/* Barcode Scanner Primary CTA */}
            <button
              id="nav-scanner-btn"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF69B4] hover:bg-[#ff52a5] rounded-full shadow-md shadow-pink-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>スキャン</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
