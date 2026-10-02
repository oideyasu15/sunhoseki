export type ProductCategory =
  | 'ほっぺちゃん'
  | '福袋・ハッピーバッグ'
  | 'ヘアアクセサリー'
  | 'リング・ネックレス'
  | 'イヤリング・ピアス'
  | 'デコ・DIYパーツ'
  | '文具・ステーショナリー'
  | 'キッズコスメ・雑貨'
  | 'バッグ・ポーチ'
  | 'その他';

export interface Product {
  id: string;
  sku: string;
  janCode: string; // 13-digit JAN or custom barcode
  name: string;
  category: ProductCategory;
  price: number; // 税込販売価格
  costPrice: number; // 仕入原価
  stockQuantity: number; // 現在庫数
  minStockThreshold: number; // 適正発注点（この数を下回ると警告）
  location: string; // 保管場所・棚番 (例: A-01-2)
  images: string[]; // 写真URLまたはBase64
  primaryImageIndex: number;
  description: string;
  catchphrase?: string;
  tags: string[];
  supplier?: string; // 仕入先・メーカー
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'in' | 'out' | 'audit' | 'discard' | 'move';

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  janCode: string;
  type: TransactionType;
  quantityChanged: number; // 正の数 or 負の数
  previousStock: number;
  newStock: number;
  reason: string;
  operator: string;
  timestamp: string;
  note?: string;
}

export type ScannerMode = 'lookup' | 'stock_in' | 'stock_out' | 'audit';

export type LabelTemplate = 'standard_tag' | 'shelf_label' | 'mini_jewelry' | 'a4_sheet';

export interface LabelPrintConfig {
  template: LabelTemplate;
  showPhoto: boolean;
  showPrice: boolean;
  showTaxIncluded: boolean;
  showLocation: boolean;
  showJanCodeText: boolean;
  showCategory: boolean;
  items: { productId: string; quantity: number }[];
}
