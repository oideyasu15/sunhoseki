import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  QrCode,
  Plus,
  Printer,
  History,
  BarChart3,
  Search,
  LayoutGrid,
  List,
  Filter,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpDown,
  TrendingUp,
  MapPin,
  Camera,
  Users,
  RefreshCw,
  CheckSquare,
  Square,
  PackageMinus,
  PackagePlus,
  Check,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Product, ProductCategory, StockTransaction, TransactionType } from './types';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductTableView } from './components/ProductTableView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ProductFormModal } from './components/ProductFormModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { BarcodePrintModal } from './components/BarcodePrintModal';
import { StockInOutModal } from './components/StockInOutModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { AnalyticsOverviewModal } from './components/AnalyticsOverviewModal';
import { DataManagementModal } from './components/DataManagementModal';
import { ManualPdfModal } from './components/ManualPdfModal';
import { BatchStockModal } from './components/BatchStockModal';
import { playSuccessBeep } from './utils/sound';
import {
  fetchSyncState,
  saveProductOnServer,
  deleteProductOnServer,
  batchSaveProductsOnServer,
  recordTransactionOnServer,
  clearTransactionsOnServer,
  subscribeToRealtimeSync,
  SyncStatus,
} from './services/api';

const STORAGE_KEY_PRODUCTS = 'sunhoseki_inventory_products_v1';
const STORAGE_KEY_TRANSACTIONS = 'sunhoseki_inventory_transactions_v1';

export default function App() {
  // Sync status across multi-users
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Products state (initialized from localStorage cache, then synced from shared server)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return SAMPLE_PRODUCTS;
  });

  // Stock Transactions History state
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load transactions', e);
    }
    return [];
  });

  // Realtime Server Synchronization Setup
  useEffect(() => {
    // 1. Initial State Fetch
    fetchSyncState().then((state) => {
      if (state && Array.isArray(state.products)) {
        setProducts(state.products);
        if (Array.isArray(state.transactions)) {
          setTransactions(state.transactions);
        }
        setLastSyncTime(new Date().toLocaleTimeString('ja-JP'));
        setSyncStatus('connected');
      }
    });

    // 2. Realtime SSE push subscription
    const unsubscribe = subscribeToRealtimeSync(
      (serverState) => {
        if (serverState && Array.isArray(serverState.products)) {
          setProducts(serverState.products);
          if (Array.isArray(serverState.transactions)) {
            setTransactions(serverState.transactions);
          }
          setLastSyncTime(new Date().toLocaleTimeString('ja-JP'));
          try {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(serverState.products));
            localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(serverState.transactions));
          } catch (e) {
            // Ignored
          }
        }
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Save cache to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }, [transactions]);

  // Manual Re-sync handler
  const handleManualSync = useCallback(() => {
    setSyncStatus('syncing');
    fetchSyncState().then((state) => {
      if (state && Array.isArray(state.products)) {
        setProducts(state.products);
        if (Array.isArray(state.transactions)) {
          setTransactions(state.transactions);
        }
        setLastSyncTime(new Date().toLocaleTimeString('ja-JP'));
        setSyncStatus('connected');
      }
    });
  }, []);

  // Filtering and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal Visibility States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSingleProductId, setPrintSingleProductId] = useState<string | undefined>();
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Multi-Selection State for Batch Actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBatchStockModalOpen, setIsBatchStockModalOpen] = useState<boolean>(false);

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleToggleSelectAll = (filteredList: Product[]) => {
    const filteredIds = filteredList.map((p) => p.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedProductIds.includes(id));
    if (isAllSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  // Execute Batch Stock In/Out Adjustment
  const handleExecuteBatchStock = (
    adjustments: { productId: string; delta: number }[],
    type: TransactionType,
    reason: string,
    operator: string
  ) => {
    const updatedMap = new Map<string, number>();
    const newTxs: StockTransaction[] = [];
    const timestamp = new Date().toISOString();

    setProducts((prev) => {
      const nextProducts = prev.map((p) => {
        const adj = adjustments.find((a) => a.productId === p.id);
        if (!adj || adj.delta === 0) return p;

        const previousStock = p.stockQuantity;
        const newStock = Math.max(0, previousStock + adj.delta);
        updatedMap.set(p.id, newStock);

        const tx: StockTransaction = {
          id: `tx-batch-${Date.now()}-${p.id}-${Math.floor(Math.random() * 1000)}`,
          productId: p.id,
          productName: p.name,
          janCode: p.janCode,
          type,
          quantityChanged: adj.delta,
          previousStock,
          newStock,
          reason,
          operator: operator || '担当スタッフ',
          timestamp,
        };
        newTxs.push(tx);

        return {
          ...p,
          stockQuantity: newStock,
          updatedAt: timestamp,
        };
      });

      // Batch save products to server
      batchSaveProductsOnServer(nextProducts);
      return nextProducts;
    });

    // Record all transactions
    if (newTxs.length > 0) {
      setTransactions((prev) => [...newTxs, ...prev]);
      newTxs.forEach((tx) => recordTransactionOnServer(tx));
    }

    playSuccessBeep();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
    });
  };

  // Helper: Record a Stock Transaction (optimistic local + shared server push)
  const recordTransaction = (
    productId: string,
    delta: number,
    type: TransactionType,
    reason: string,
    operator: string = '担当者'
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const previousStock = targetProduct.stockQuantity;
    let newStock = previousStock + delta;
    if (type === 'audit') {
      newStock = previousStock + delta; // delta was calculated as (auditCount - prevStock)
    }
    newStock = Math.max(0, newStock);

    // Optimistically update product stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stockQuantity: newStock,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    // Log transaction locally
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName: targetProduct.name,
      janCode: targetProduct.janCode,
      type,
      quantityChanged: delta,
      previousStock,
      newStock,
      reason: reason || '在庫変動',
      operator: operator || '担当者',
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Send to shared server for persistent storage and broadcast to all users
    recordTransactionOnServer(newTx);

    // Update active modal product state if currently inspected
    if (detailProduct && detailProduct.id === productId) {
      setDetailProduct((prev) => (prev ? { ...prev, stockQuantity: newStock } : null));
    }
  };

  // Quick inline +/- adjustment
  const handleQuickStockAdjust = (product: Product, delta: number) => {
    const type: TransactionType = delta > 0 ? 'in' : 'out';
    const reason = delta > 0 ? '簡易追加 (+1)' : '簡易減数 (-1)';
    recordTransaction(product.id, delta, type, reason, 'レジ・現場操作');
    playSuccessBeep();
  };

  // Add / Edit Product Save (optimistic + shared server sync)
  const handleSaveProduct = (product: Product) => {
    const isEdit = products.some((p) => p.id === product.id);
    if (isEdit) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
    } else {
      setProducts((prev) => [product, ...prev]);
      // Log initial stock creation transaction if stock > 0
      if (product.stockQuantity > 0) {
        recordTransaction(
          product.id,
          product.stockQuantity,
          'in',
          '新規商品登録時初期在庫',
          '管理者'
        );
      }
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    // Save to shared server
    saveProductOnServer(product);
  };

  // Delete product (optimistic + shared server sync)
  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteProductOnServer(id);
  };

  // Batch update products (CSV / JSON import / Reset)
  const handleBatchUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    batchSaveProductsOnServer(newProducts);
  };

  // Clear transaction history
  const handleClearHistory = () => {
    setTransactions([]);
    clearTransactionsOnServer();
  };

  // Japanese / full-width normalization helper
  const normalizeSearchText = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      // Convert full-width alphanumeric and spaces to half-width
      .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      // Convert full-width Japanese space to normal space
      .replace(/　/g, ' ')
      // Convert Hiragana to Katakana for phonetic matching
      .replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
      .trim();
  };

  // Filtered and sorted products
  const filteredProducts = products.filter((p) => {
    // Search query (Supports multiple space-separated keywords, Hiragana/Katakana, Name, SKU, JAN, Location, Tags, Description)
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeSearchText(searchQuery);
      const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

      const targetString = [
        p.name || '',
        p.sku || '',
        p.janCode || '',
        p.location || '',
        p.description || '',
        p.category || '',
        p.supplier || '',
        ...(p.tags || []),
      ]
        .map(normalizeSearchText)
        .join(' ');

      // Every keyword token must match
      const allTokensMatch = queryTokens.every((token) => targetString.includes(token));
      if (!allTokensMatch) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }

    // Stock filter
    if (stockFilter === 'low') {
      return p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold;
    }
    if (stockFilter === 'out') {
      return p.stockQuantity === 0;
    }
    if (stockFilter === 'in_stock') {
      return p.stockQuantity > 0;
    }

    return true;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ja');
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'stock_asc') return a.stockQuantity - b.stockQuantity;
    if (sortBy === 'stock_desc') return b.stockQuantity - a.stockQuantity;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.minStockThreshold
  ).length;

  const totalStockCount = products.reduce((acc, p) => acc + p.stockQuantity, 0);

  const categories: ProductCategory[] = [
    'ほっぺちゃん',
    '福袋・ハッピーバッグ',
    'ヘアアクセサリー',
    'リング・ネックレス',
    'イヤリング・ピアス',
    'デコ・DIYパーツ',
    '文具・ステーショナリー',
    'キッズコスメ・雑貨',
    'バッグ・ポーチ',
    'その他',
  ];

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#4A4A4A] flex flex-col font-sans selection:bg-pink-200">
      {/* Top Navigation */}
      <Navbar
        products={products}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNewProduct={() => {
          setEditingProduct(null);
          setIsProductFormOpen(true);
        }}
        onOpenPrint={() => {
          setPrintSingleProductId(undefined);
          setIsPrintModalOpen(true);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenDataManagement={() => setIsDataManagementOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        lowStockCount={lowStockCount}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-3xl p-4.5 border border-[#FFD1DC] shadow-xs hover:border-[#FF69B4] hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#FF69B4] flex items-center justify-center font-bold border border-[#FFD1DC]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                登録アイテム数
              </div>
              <div className="text-xl font-black text-[#1A1A1A]">
                {products.length}{' '}
                <span className="text-xs font-normal text-stone-500">品目</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4.5 border border-[#FFD1DC] shadow-xs hover:border-[#FF69B4] hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#FF69B4] flex items-center justify-center font-bold border border-[#FFD1DC]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                在庫総数量
              </div>
              <div className="text-xl font-black text-[#1A1A1A]">
                {totalStockCount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-stone-500">個</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4.5 border border-[#FFD1DC] shadow-xs hover:border-[#FF69B4] hover:shadow-md transition-all flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#FF69B4] flex items-center justify-center font-bold border border-[#FFD1DC]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                在庫売価総額
              </div>
              <div className="text-xl font-black text-[#FF69B4]">
                ¥
                {products
                  .reduce((sum, p) => sum + p.stockQuantity * p.price, 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsAnalyticsOpen(true)}
            className={`rounded-3xl p-4.5 border shadow-xs flex items-center gap-3.5 cursor-pointer transition-all hover:scale-[1.01] ${
              lowStockCount > 0
                ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828] hover:border-[#E53935]'
                : 'bg-white border-[#FFD1DC] hover:border-[#FF69B4]'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                lowStockCount > 0
                  ? 'bg-[#E53935] text-white animate-pulse'
                  : 'bg-[#FFF0F5] text-[#FF69B4] border border-[#FFD1DC]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold opacity-80 uppercase tracking-wider">
                発注・補充アラート
              </div>
              <div className="text-xl font-black">
                {lowStockCount}{' '}
                <span className="text-xs font-normal opacity-75">品目</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Category Tabs Header */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFD1DC] shadow-xs space-y-4">
          {/* Prominent In-Page Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#FF69B4] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="main-product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="商品名、ひらがな/カタカナ、JANコード、棚番号、タグ、説明文でリアルタイム検索..."
              className="w-full pl-12 pr-28 py-3 text-sm sm:text-base bg-[#FFF5F7] hover:bg-[#FFFBFD] focus:bg-white border-2 border-[#FFD1DC] focus:border-[#FF69B4] focus:ring-4 focus:ring-[#FF69B4]/15 rounded-2xl outline-none transition-all placeholder:text-stone-400 font-bold text-[#1A1A1A] shadow-xs"
            />
            {searchQuery ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#FF69B4] bg-[#FFE4EC] px-2 py-0.5 rounded-full hidden sm:inline">
                  {sortedProducts.length}件一致
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 py-1 text-xs font-bold text-stone-500 hover:text-stone-800 bg-stone-200/80 hover:bg-stone-300 rounded-full transition-colors flex items-center gap-1"
                  title="検索ワードをクリア"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>クリア</span>
                </button>
              </div>
            ) : (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold hidden sm:inline">
                全 {products.length} 件
              </span>
            )}
          </div>

          {/* Active Search Result Notification if Searching */}
          {searchQuery && (
            <div className="bg-[#FFF0F5] border border-[#FFD1DC] rounded-2xl px-4 py-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#FF69B4]" />
                <span className="text-stone-600">
                  「<strong className="text-[#FF69B4] font-black">{searchQuery}</strong>」の検索結果:
                  <span className="ml-1.5 font-black text-[#1A1A1A]">{sortedProducts.length} 件</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold text-[#FF69B4] hover:underline"
              >
                すべての商品を表示
              </button>
            </div>
          )}

          {/* Categories Pill Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              id="category-tab-all"
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#FF69B4] text-white shadow-md shadow-pink-200'
                  : 'bg-[#FFF0F5] text-[#4A4A4A] hover:bg-[#FFE4EC] hover:text-[#FF69B4] border border-[#FFD1DC]/60'
              }`}
            >
              すべて ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#FF69B4] text-white shadow-md shadow-pink-200'
                      : 'bg-[#FFF0F5] text-[#4A4A4A] hover:bg-[#FFE4EC] hover:text-[#FF69B4] border border-[#FFD1DC]/60'
                  }`}
                >
                  {cat} {count > 0 && <span className="opacity-80">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Secondary Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#FFD1DC]/40 text-xs">
            {/* Stock State Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-stone-400 font-bold mr-1">状態:</span>
              {[
                { id: 'all', label: '全在庫' },
                { id: 'low', label: '要補充・低在庫' },
                { id: 'out', label: '在庫ゼロ' },
                { id: 'in_stock', label: '在庫あり' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStockFilter(s.id as any)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                    stockFilter === s.id
                      ? 'bg-[#FF69B4] text-white shadow-xs'
                      : 'bg-[#FFF5F7] text-[#4A4A4A] hover:bg-[#FFE4EC] hover:text-[#FF69B4] border border-[#FFD1DC]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Selection Controls & Sort & View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Batch Select All / Deselect button in filter bar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(sortedProducts)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 border ${
                    sortedProducts.length > 0 &&
                    sortedProducts.every((p) => selectedProductIds.includes(p.id))
                      ? 'bg-[#FF69B4] text-white border-[#FF69B4] shadow-xs'
                      : selectedProductIds.length > 0
                      ? 'bg-pink-100 text-[#FF69B4] border-[#FFD1DC]'
                      : 'bg-[#FFF5F7] text-stone-600 border-[#FFD1DC] hover:text-[#FF69B4] hover:bg-[#FFE4EC]'
                  }`}
                  title="表示中の全商品を選択/解除"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {sortedProducts.length > 0 &&
                    sortedProducts.every((p) => selectedProductIds.includes(p.id))
                      ? '表示中を全解除'
                      : `表示全選択 (${sortedProducts.length})`}
                  </span>
                </button>

                {selectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1.5 rounded-full font-bold text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors text-[11px]"
                  >
                    選択クリア ({selectedProductIds.length})
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-1 text-[#4A4A4A]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#FF69B4]" />
                <select
                  id="sort-product-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FFF5F7] border border-[#FFD1DC] rounded-full px-3 py-1.5 text-xs font-bold text-[#4A4A4A] focus:border-[#FF69B4] outline-none"
                >
                  <option value="newest">登録順 (新着順)</option>
                  <option value="name">商品名 (50音順)</option>
                  <option value="price_asc">価格の安い順</option>
                  <option value="price_desc">価格の高い順</option>
                  <option value="stock_asc">在庫の少ない順</option>
                  <option value="stock_desc">在庫の多い順</option>
                </select>
              </div>

              {/* Grid vs Table View Mode */}
              <div className="flex items-center bg-[#FFF0F5] p-1 rounded-full border border-[#FFD1DC]">
                <button
                  id="view-mode-grid"
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#FF69B4] text-white shadow-xs'
                      : 'text-stone-400 hover:text-[#FF69B4]'
                  }`}
                  title="グリッド表示"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  id="view-mode-table"
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === 'table'
                      ? 'bg-[#FF69B4] text-white shadow-xs'
                      : 'text-stone-400 hover:text-[#FF69B4]'
                  }`}
                  title="リスト・テーブル表示"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Display Area */}
        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#FFD1DC] p-12 text-center text-stone-400 space-y-3 shadow-xs">
            <Package className="w-12 h-12 mx-auto text-[#FF69B4]/40 stroke-1" />
            <h3 className="text-base font-bold text-[#1A1A1A]">
              該当する商品が見つかりませんでした
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              検索ワードやカテゴリー絞り込みを変更するか、右上の「商品登録」から新しく追加してください。
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStockFilter('all');
                }}
                className="px-4 py-2 bg-[#FFF0F5] hover:bg-[#FFE4EC] text-[#4A4A4A] font-bold text-xs rounded-full border border-[#FFD1DC] transition-colors"
              >
                条件をクリア
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductFormOpen(true);
                }}
                className="px-5 py-2 bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-bold text-xs rounded-full shadow-md shadow-pink-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>新規商品を登録</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isSelected={selectedProductIds.includes(p.id)}
                onToggleSelect={handleToggleSelectProduct}
                onClick={() => setDetailProduct(p)}
                onStockQuickAdjust={handleQuickStockAdjust}
                onOpenPrint={(id) => {
                  setPrintSingleProductId(id);
                  setIsPrintModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <ProductTableView
            products={sortedProducts}
            selectedIds={selectedProductIds}
            onToggleSelect={handleToggleSelectProduct}
            onToggleSelectAll={() => handleToggleSelectAll(sortedProducts)}
            onSelectProduct={(p) => setDetailProduct(p)}
            onEdit={(p) => {
              setEditingProduct(p);
              setIsProductFormOpen(true);
            }}
            onDelete={handleDeleteProduct}
            onStockQuickAdjust={handleQuickStockAdjust}
            onOpenPrint={(id) => {
              setPrintSingleProductId(id);
              setIsPrintModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Sticky Floating Multi-Select Action Bar (Bottom) */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-stone-900/95 text-white rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-pink-400/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF69B4] text-white flex items-center justify-center font-black text-xs shadow-sm">
              {selectedProductIds.length}
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{selectedProductIds.length} 件選択中</span>
              </div>
              <div className="text-[10px] text-stone-300">
                チェックした商品に対して一括処理
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Main Batch Stock Decrease Trigger Button */}
            <button
              id="batch-stock-decrease-btn"
              type="button"
              onClick={() => setIsBatchStockModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-black text-xs shadow-md shadow-pink-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <PackageMinus className="w-4 h-4" />
              <span>一括出庫・減少 (-〇個)</span>
            </button>

            {/* Print Labels for selection */}
            <button
              type="button"
              onClick={() => {
                setPrintSingleProductId(undefined);
                setIsPrintModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20"
              title="選択した商品の値札ラベル印刷"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ラベル印刷</span>
            </button>

            {/* Cancel / Clear Selection */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              title="選択をすべて解除"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Information Footer Bar */}
      <footer className="no-print border-t border-[#FFD1DC] bg-white/80 py-4 px-4 sm:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1A1A1A]">サン宝石 バーコード商品・在庫管理システム</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF69B4] font-bold border border-[#FFD1DC]">
              リアルタイム同期対応
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              className="text-[#FF69B4] hover:text-[#ff52a5] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>📖 取扱説明書 (PDF印刷 / 保存)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDataManagementOpen(true)}
              className="text-stone-500 hover:text-stone-700 font-medium hover:underline cursor-pointer"
            >
              データバックアップ (CSV/JSON)
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Action Button: Quick Barcode Scan */}
      <button
        id="fab-barcode-scanner"
        type="button"
        onClick={() => setIsScannerOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-[#FF69B4] hover:bg-[#ff52a5] text-white font-black text-sm shadow-xl shadow-pink-300/60 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 border-2 border-white/40"
      >
        <QrCode className="w-5 h-5 animate-pulse" />
        <span>バーコードスキャン</span>
      </button>

      {/* Modals */}
      {/* 1. Barcode Camera / Hardware Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onSelectProduct={(p) => {
          setDetailProduct(p);
        }}
        onStockAdjustment={(id, delta, type, reason) => {
          recordTransaction(id, delta, type, reason, 'バーコードスキャナー');
        }}
      />

      {/* 2. Product Registration / Edit */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />

      {/* 3. Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!detailProduct}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEdit={(p) => {
          setEditingProduct(p);
          setIsProductFormOpen(true);
        }}
        onDelete={handleDeleteProduct}
        onOpenStockAdjust={(p) => {
          setStockAdjustProduct(p);
        }}
        onOpenPrintSingle={(id) => {
          setPrintSingleProductId(id);
          setIsPrintModalOpen(true);
        }}
        transactions={transactions}
      />

      {/* 4. Barcode Printable Labels Modal */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintSingleProductId(undefined);
        }}
        products={products}
        initialSelectedProductId={printSingleProductId}
      />

      {/* 5. Stock In/Out Adjustment Modal */}
      <StockInOutModal
        isOpen={!!stockAdjustProduct}
        product={stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        onConfirm={(id, delta, type, reason, op) => {
          recordTransaction(id, delta, type, reason, op);
          setStockAdjustProduct(null);
        }}
      />

      {/* 6. Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={transactions}
        onClearHistory={handleClearHistory}
      />

      {/* 7. Analytics & Low-Stock Alerts Overview Modal */}
      <AnalyticsOverviewModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        products={products}
        onSelectProduct={(p) => {
          setIsAnalyticsOpen(false);
          setDetailProduct(p);
        }}
        onOpenStockAdjust={(p) => {
          setIsAnalyticsOpen(false);
          setStockAdjustProduct(p);
        }}
      />

      {/* 8. Data Management (CSV/JSON/Backup) */}
      <DataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        products={products}
        onUpdateProducts={handleBatchUpdateProducts}
      />

      {/* 9. Visual Manual & PDF Modal */}
      <ManualPdfModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* 10. Batch Stock Decrease / Increase Modal */}
      <BatchStockModal
        isOpen={isBatchStockModalOpen}
        onClose={() => setIsBatchStockModalOpen(false)}
        selectedProducts={products.filter((p) => selectedProductIds.includes(p.id))}
        onExecuteBatchStock={handleExecuteBatchStock}
        onRemoveFromSelection={handleToggleSelectProduct}
      />
    </div>
  );
}
