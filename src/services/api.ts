import { Product, StockTransaction } from '../types';

export interface SyncState {
  products: Product[];
  transactions: StockTransaction[];
  lastUpdated: string;
  version: number;
}

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

/**
 * Fetch full current inventory state from server
 */
export async function fetchSyncState(): Promise<SyncState | null> {
  try {
    const res = await fetch('/api/sync/state');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch sync state from server:', err);
    return null;
  }
}

/**
 * Save or update a product on the shared server
 */
export async function saveProductOnServer(product: Product): Promise<Product | null> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.product || product;
  } catch (err) {
    console.error('Failed to save product to server:', err);
    return null;
  }
}

/**
 * Delete a product on the shared server
 */
export async function deleteProductOnServer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete product on server:', err);
    return false;
  }
}

/**
 * Batch replace or import products on server
 */
export async function batchSaveProductsOnServer(products: Product[]): Promise<Product[] | null> {
  try {
    const res = await fetch('/api/products/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.products || products;
  } catch (err) {
    console.error('Failed to batch save products to server:', err);
    return null;
  }
}

/**
 * Record stock in/out/audit transaction on the shared server
 */
export async function recordTransactionOnServer(
  tx: Omit<StockTransaction, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): Promise<StockTransaction | null> {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.transaction || null;
  } catch (err) {
    console.error('Failed to record transaction to server:', err);
    return null;
  }
}

/**
 * Clear all transaction logs on server
 */
export async function clearTransactionsOnServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/transactions', {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to clear transactions on server:', err);
    return false;
  }
}

/**
 * Reset server storage to default Sunhoseki sample products
 */
export async function resetSampleOnServer(): Promise<SyncState | null> {
  try {
    const res = await fetch('/api/reset-sample', {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to reset sample on server:', err);
    return null;
  }
}

/**
 * Subscribe to realtime server-sent events (SSE) for live synchronization across all users
 */
export function subscribeToRealtimeSync(
  onStateUpdate: (state: SyncState) => void,
  onStatusChange: (status: SyncStatus) => void
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: any = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    onStatusChange('syncing');

    try {
      eventSource = new EventSource('/api/sync/events');

      eventSource.onopen = () => {
        onStatusChange('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && (parsed.type === 'INIT_STATE' || parsed.type === 'STATE_UPDATE')) {
            onStateUpdate(parsed.data);
            onStatusChange('connected');
          }
        } catch (e) {
          console.error('Failed to parse SSE event data:', e);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        onStatusChange('offline');
        if (!isClosed) {
          // Attempt reconnection after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      onStatusChange('error');
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
