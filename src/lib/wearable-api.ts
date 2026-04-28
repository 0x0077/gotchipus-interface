export interface BackendWearable {
  id: number;
  wearable_id: string;
  name: string;
  description: string;
  image_url: string;
  rarity: string;
  slot_type: string;
  price: number;
  currency: string;
  total_supply: number;
  remaining_supply: number;
  sold_count: number;
  is_active: boolean;
  stat_str: number;
  stat_def: number;
  stat_int: number;
  stat_vit: number;
  stat_agi: number;
  stat_luk: number;
  owner_address: string;
  author_address: string;
  royalty_pct: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T = unknown> {
  code: number;
  status: string;
  data?: T;
  message?: string;
}

async function postJson<T = unknown>(url: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function fetchWearableList(page = 0) {
  return postJson<BackendWearable[]>('/api/wearable/list', { page });
}

export async function purchaseWearable(wearableId: string, buyerAddress: string) {
  return postJson('/api/wearable/purchase', { wearable_id: wearableId, buyer_address: buyerAddress });
}

export async function batchPurchaseWearables(wearableIds: string[], buyerAddress: string) {
  return postJson('/api/wearable/batch-purchase', { wearable_ids: wearableIds, buyer_address: buyerAddress });
}

export interface WearableTransaction {
  id: number;
  tx_hash: string;
  wearable_id: string;
  wearable_name?: string;
  tx_type: string;
  status: string;
  from_address: string;
  to_address: string;
  price: number;
  currency: string;
  royalty_amount: number;
  platform_fee: number;
  gotchi_id: string;
  slot_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  confirmed_at: string;
}

export async function fetchUserTransactions(address: string, page = 0) {
  return postJson<WearableTransaction[]>('/api/wearable/tx/by-user', { address, page });
}
