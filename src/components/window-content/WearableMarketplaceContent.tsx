'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { useWearableMarketplaceWrite, useERC20Read } from "@/src/hooks/useContract"
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { useToast } from '@/hooks/use-toast'
import { observer } from "mobx-react-lite"
import { useStores } from "@stores/context"
import { ERC20_ABI, PUS_ADDRESS } from "@/src/app/blockchain"
import { TOKEN_ID_TO_IMAGE } from "@/components/gotchiSvg/config"
import { Win98Select } from "@/components/ui/win98-select"
import { useWindowMode } from "@/hooks/useWindowMode"
import { fetchWearableList, batchPurchaseWearables, fetchUserTransactions, BackendWearable, WearableTransaction } from "@/lib/wearable-api"
import { supabase } from "@/lib/supabase"
import {
  WearableItem,
  CartItem,
  SortOption,
  RARITY,
  RARITY_TIER,
  CATEGORY_ORDER,
  EquipCard,
  EquipDetailModal,
  ShoppingCart,
  StatsBar,
  ActivityTicker,
  GotchiPreviewPanel,
} from "@/components/equip"

const EXPLORER_TX_URL = 'https://basescan.org/tx/';
const MAX_ACTIVITY_RECORDS = 30;

interface ActivityRecord {
  id: string;
  user: string;
  item: string;
  price: number;
  time: string;
  hash: string;
  txType: string;
}

function txToActivity(tx: WearableTransaction, wearables: WearableItem[]): ActivityRecord {
  const addr = tx.from_address || '';
  const item = wearables.find(w => w.wearableId === tx.wearable_id || String(w.id) === tx.wearable_id);
  const itemName = tx.wearable_name || item?.name || `#${tx.wearable_id}`;
  return {
    id: String(tx.id),
    user: addr ? `${addr.slice(0, 4)}..${addr.slice(-2)}` : '??',
    item: itemName,
    price: tx.price,
    time: getTimeAgo(tx.created_at),
    hash: tx.tx_hash || '',
    txType: tx.tx_type,
  };
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const SLOT_TO_CATEGORY: Record<string, WearableItem['category']> = {
  head: 'head',
  hand: 'hand',
  cloth: 'clothes',
  clothes: 'clothes',
  face: 'face',
  faces: 'face',
  mouth: 'mouth',
};

function mapBackendToWearableItem(item: BackendWearable): WearableItem | null {
  const category = SLOT_TO_CATEGORY[item.slot_type];
  if (!category) {
    return null;
  }

  const stats: Record<string, number> = {};
  if (item.stat_str) stats.STR = item.stat_str;
  if (item.stat_def) stats.DEF = item.stat_def;
  if (item.stat_int) stats.INT = item.stat_int;
  if (item.stat_vit) stats.VIT = item.stat_vit;
  if (item.stat_agi) stats.AGI = item.stat_agi;
  if (item.stat_luk) stats.LUK = item.stat_luk;

  const numId = parseInt(item.wearable_id);
  return {
    id: numId,
    wearableId: item.wearable_id,
    name: item.name,
    imagePath: item.image_url || TOKEN_ID_TO_IMAGE[numId] || '',
    category,
    rarity: item.rarity as WearableItem['rarity'],
    price: item.price,
    description: item.description,
    stats,
    totalSupply: item.total_supply,
    remainingSupply: item.remaining_supply,
    soldCount: item.sold_count,
    currency: item.currency,
  };
}

/* ═══════════════════════════════════════
   WIN98 BUTTON PRIMITIVE
   ═══════════════════════════════════════ */
function Btn({ children, onClick, primary, active, small, disabled, style: sx, className: extraCls }: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  primary?: boolean;
  active?: boolean;
  small?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`border-none text-[11px] font-win98 whitespace-nowrap tracking-[0.2px] ${extraCls || ''}`}
      style={{
        boxShadow: active
          ? 'inset 1px 1px #0a0a0a, inset -1px -1px #fff, inset 2px 2px #808080, inset -2px -2px #dfdfdf'
          : 'inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf',
        background: primary ? '#000080' : '#c0c0c0',
        color: primary ? '#fff' : disabled ? '#808080' : '#000000',
        padding: small ? '2px 8px' : '3px 12px',
        fontWeight: primary ? 'bold' : 'normal',
        cursor: disabled ? 'default' : 'pointer',
        ...sx,
      }}
    >{children}</button>
  );
}

/* ═══════════════════════════════════════
   USDC CONSTANTS & STEP UI
   ═══════════════════════════════════════ */
const USDC_ADDRESS = "0xC879C018dB60520F4355C26eD1a6D572cdAC1815";
const USDC_DECIMALS = 6;

type PurchaseStep = "idle" | "approving" | "purchasing" | "done";

function getStepStatus(
  current: PurchaseStep,
  target: "approve" | "purchase",
  skippedApprove: boolean
): "done" | "active" | "pending" {
  if (target === "approve") {
    if (skippedApprove) return "done";
    if (current === "approving") return "active";
    if (current === "purchasing" || current === "done") return "done";
    return "pending";
  }
  if (current === "purchasing") return "active";
  if (current === "done") return "done";
  return "pending";
}

function StepStatus({ label, status }: { label: string; status: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      {status === "done" && <span className="text-[#008000] font-bold">{"\u2713"}</span>}
      {status === "active" && <span className="inline-block w-2.5 h-2.5 border-2 border-[#000080] border-t-transparent rounded-full animate-spin" />}
      {status === "pending" && <span className="text-[#808080]">{"\u25CB"}</span>}
      <span className={status === "active" ? "font-bold text-[#000080]" : status === "done" ? "text-[#008000]" : "text-[#808080]"}>
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
const WearableMarketplaceContent = observer(() => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { walletStore } = useStores();
  const { isMobile } = useWindowMode();

  const { address } = useAccount();

  const {
    purchaseWearables,
    isConfirmed,
    error,
    isPending,
    isConfirming
  } = useWearableMarketplaceWrite();

  // ── Approve tx ──
  const {
    data: approveHash,
    writeContract: writeApprove,
    error: approveWriteError,
    reset: resetApprove
  } = useWriteContract();

  const {
    isSuccess: approveConfirmed,
    error: approveConfirmError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const approveError = approveWriteError || approveConfirmError;

  // ── USDC reads ──
  const { data: usdcBalanceRaw, refetch: refetchUsdcBalance } = useERC20Read(
    USDC_ADDRESS,
    "balanceOf",
    address ? [address] : [],
    { enabled: !!address }
  );

  const { data: usdcAllowanceRaw, refetch: refetchAllowance } = useERC20Read(
    USDC_ADDRESS,
    "allowance",
    address ? [address, PUS_ADDRESS] : [],
    { enabled: !!address }
  );

  const usdcBalance = usdcBalanceRaw ? Number(usdcBalanceRaw) / 10 ** USDC_DECIMALS : 0;
  const usdcAllowance = usdcAllowanceRaw ? BigInt(usdcAllowanceRaw as string) : BigInt(0);

  // State
  const [wearableItems, setWearableItems] = useState<WearableItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [slot, setSlot] = useState('All');
  const [rarity, setRarity] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('price-asc');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [preview, setPreview] = useState<WearableItem | null>(null);
  const [tryOnItems, setTryOnItems] = useState<WearableItem[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>("idle");
  const [skippedApprove, setSkippedApprove] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [latestActivityId, setLatestActivityId] = useState<string | null>(null);
  // Cart items saved for DB recording after on-chain tx confirms
  const [pendingCartForDb, setPendingCartForDb] = useState<CartItem[]>([]);

  // Fetch wearable list from backend
  const loadWearables = useCallback(async () => {
    if (isLoadingItems) return;
    setIsLoadingItems(true);
    try {
      const res = await fetchWearableList(0);
      if (res.code === 0 && res.data) {
        const items = (res.data as BackendWearable[])
          .map(mapBackendToWearableItem)
          .filter((item): item is WearableItem => item !== null);
        setWearableItems(items);
      }
    } catch (e) {
    } finally {
      setIsLoadingItems(false);
    }
  }, [isLoadingItems]);

  // Initial load
  useEffect(() => {
    loadWearables();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user transaction history for activity feed
  useEffect(() => {
    if (!walletStore.isConnected || !walletStore.address) {
      setActivities([]);
      return;
    }
    fetchUserTransactions(walletStore.address, 0).then(res => {
      if (res.code === 0 && res.data) {
        const records = (res.data as WearableTransaction[]).map(tx => txToActivity(tx, wearableItems));
        setActivities(records.slice(0, MAX_ACTIVITY_RECORDS));
      }
    }).catch(e => {});
  }, [walletStore.isConnected, walletStore.address, wearableItems]);

  const addActivity = useCallback((record: ActivityRecord) => {
    setLatestActivityId(record.id);
    setActivities(prev => [record, ...prev].slice(0, MAX_ACTIVITY_RECORDS));
  }, []);

  // Supabase realtime subscription for LIVE ticker
  const wearableItemsRef = useRef<WearableItem[]>(wearableItems);
  useEffect(() => { wearableItemsRef.current = wearableItems; }, [wearableItems]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('wearable_transactions_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wearable_transactions' },
        (payload) => {
          const tx = payload.new as WearableTransaction;
          const record = txToActivity(tx, wearableItemsRef.current);
          addActivity(record);
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [addActivity]);

  const handleTryOn = useCallback((item: WearableItem) => {
    setTryOnItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.filter(i => i.id !== item.id);
      // Same category → replace; different category → add
      return [...prev.filter(i => i.category !== item.category), item];
    });
  }, []);

  // Periodically refresh USDC balance/allowance
  useEffect(() => {
    if (!address) return;
    const timer = setInterval(() => {
      refetchUsdcBalance();
      refetchAllowance();
    }, 5000);
    return () => clearInterval(timer);
  }, [address, refetchUsdcBalance, refetchAllowance]);

  // When approve confirmed → proceed to purchase
  useEffect(() => {
    if (approveConfirmed && purchaseStep === "approving") {
      setPurchaseStep("purchasing");
      refetchAllowance();
      const itemIds = pendingCartForDb.map(item => item.id);
      const quantities = pendingCartForDb.map(item => item.quantity);
      purchaseWearables(itemIds, quantities);
    }
  }, [approveConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  // On approve error
  useEffect(() => {
    if (approveError && purchaseStep === "approving") {
      setPurchaseStep("idle");
      setIsPurchasing(false);
      setPurchaseError("Approve failed: " + (approveError as Error).message?.slice(0, 80));
      resetApprove();
    }
  }, [approveError]); // eslint-disable-line react-hooks/exhaustive-deps

  // On purchase error
  useEffect(() => {
    if (error && purchaseStep === "purchasing") {
      setPurchaseStep("idle");
      setIsPurchasing(false);
      setPurchaseError("Purchase failed: " + (error as Error).message?.slice(0, 80));
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isPending || isConfirming) setIsPurchasing(true);
  }, [isPending, isConfirming]);

  // Filter + sort
  const filtered = useMemo(() => {
    return wearableItems
      .filter(i => slot === 'All' || i.category === slot)
      .filter(i => rarity === 'All' || i.rarity === rarity)
      .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        if (sort === 'rarity') return (RARITY_TIER[b.rarity] || 0) - (RARITY_TIER[a.rarity] || 0);
        return b.id - a.id;
      });
  }, [wearableItems, slot, rarity, search, sort]);

  // Cart helpers
  const addToCart = (id: number) => setCart(p => {
    const ex = p.find(c => c.id === id);
    if (ex) return p.map(c => c.id === id ? { ...c, quantity: c.quantity + 1 } : c);
    const item = wearableItems.find(i => i.id === id);
    if (!item) return p;
    return [...p, { ...item, quantity: 1 }];
  });
  const removeFromCart = (id: number) => setCart(p => p.filter(c => c.id !== id));
  const updateQty = (id: number, q: number) => q < 1 ? removeFromCart(id) : setCart(p => p.map(c => c.id === id ? { ...c, quantity: q } : c));
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handlePurchase = async () => {
    if (cart.length === 0) return;
    setIsPurchasing(true);
    setPurchaseError(null);
    // Save cart snapshot for DB recording after on-chain confirmation
    setPendingCartForDb([...cart]);

    // Calculate total cost in USDC raw units (prices from backend are in USDC human units)
    const totalCostRaw = cart.reduce(
      (sum, item) => sum + BigInt(Math.round(item.price * 10 ** USDC_DECIMALS)) * BigInt(item.quantity),
      BigInt(0)
    );

    try {
      if (usdcAllowance >= totalCostRaw) {
        // Allowance sufficient, skip approve
        setSkippedApprove(true);
        setPurchaseStep("purchasing");
        const itemIds = cart.map(item => item.id);
        const quantities = cart.map(item => item.quantity);
        await purchaseWearables(itemIds, quantities);
      } else {
        // Need approve first
        setSkippedApprove(false);
        setPurchaseStep("approving");
        writeApprove({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PUS_ADDRESS, totalCostRaw],
        });
      }
      toast({ title: t('toast.txSubmitted'), description: t('toast.txSubmittedDesc') });
    } catch (err: any) {
      setIsPurchasing(false);
      setPurchaseStep("idle");
      setPendingCartForDb([]);
      toast({ title: t('toast.purchaseFailed'), description: err?.message || t('toast.purchaseFailed'), variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setIsPurchasing(false);
      setPurchaseStep("done");
      refetchUsdcBalance();
      refetchAllowance();
      toast({ title: t('toast.purchaseSuccess'), description: t('toast.purchaseSuccessDesc') });

      // Record purchase in backend DB
      if (pendingCartForDb.length > 0 && walletStore.address) {
        // Expand cart items by quantity into flat wearable_id array
        const wearableIds: string[] = [];
        for (const item of pendingCartForDb) {
          const wId = item.wearableId || String(item.id);
          for (let i = 0; i < item.quantity; i++) {
            wearableIds.push(wId);
          }
        }

        batchPurchaseWearables(wearableIds, walletStore.address)
          .then(res => {
            if (res.code === 0) {
              // Refresh list to update remaining supply
              loadWearables();
              // Refresh activity feed
              if (walletStore.address) {
                fetchUserTransactions(walletStore.address, 0).then(txRes => {
                  if (txRes.code === 0 && txRes.data) {
                    const records = (txRes.data as WearableTransaction[]).map(tx => txToActivity(tx, wearableItems));
                    setActivities(records.slice(0, MAX_ACTIVITY_RECORDS));
                    if (records.length > 0) setLatestActivityId(records[0].id);
                  }
                });
              }
            }
          })
          .catch(err => {});

        setPendingCartForDb([]);
      }

      setCart([]);
    }
  }, [isConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error && purchaseStep !== "purchasing") {
      setIsPurchasing(false);
      setPurchaseStep("idle");
      toast({ title: t('toast.purchaseFailed'), description: t('toast.txCancelledDesc'), variant: 'destructive' });
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full bg-win98-face font-[family-name:'MS_Sans_Serif','Microsoft_Sans_Serif',Tahoma,sans-serif] text-[#000000] text-[11px] flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:none} }
        @keyframes modalIn { from{opacity:0;transform:translate(-50%,-50%) scale(.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes tryOnPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes activitySlideIn { from{opacity:0;transform:translateX(-100%);max-height:0} to{opacity:1;transform:none;max-height:24px} }
        .activity-feed::-webkit-scrollbar { display:none }
        .activity-feed { scrollbar-width:none; -ms-overflow-style:none }
        .hide-scrollbar::-webkit-scrollbar { display:none }
        .hide-scrollbar { scrollbar-width:none; -ms-overflow-style:none }
      `}</style>

      {/* -- Main Layout -- */}
      <div className={`flex flex-1 min-h-0 ${isMobile ? 'flex-col' : ''}`}>

        {/* Left Sidebar */}
        <div className={`hide-scrollbar p-1 flex flex-col gap-1 bg-win98-face overflow-auto ${
          isMobile
            ? 'w-full max-h-[40%] shrink-0 border-b border-[#808080]'
            : 'w-[195px] shrink-0 border-r border-[#808080]'
        }`}>
          {/* Gotchi Preview */}
          <GotchiPreviewPanel
            tryOnItems={tryOnItems}
            onClearTryOn={() => setTryOnItems([])}
            onRemoveTryOn={(id) => setTryOnItems(prev => prev.filter(i => i.id !== id))}
            items={wearableItems}
          />

          {/* Rarity Filter */}
          <div className="shadow-win98-outer bg-win98-face">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-[6px] py-[2px] text-[11px] font-bold text-white tracking-[0.3px] flex items-center gap-1 text-shadow-win98">
              Rarity Filter
            </div>
            <div className="p-1 flex flex-col gap-[1px]">
              <Btn small active={rarity === 'All'} onClick={() => setRarity('All')}
                className="text-left w-full">All Rarities</Btn>
              {Object.entries(RARITY).map(([name, r]) => (
                <Btn key={name} small active={rarity === name} onClick={() => setRarity(name)}
                  className="text-left w-full"
                  style={{
                    borderLeft: rarity === name ? `3px solid ${r.color}` : '3px solid transparent',
                    paddingLeft: 6,
                  }}>
                  <span className="inline-block w-2 h-2 mr-1 align-middle border border-black/20"
                    style={{ background: r.color }} />
                  {name}
                </Btn>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="shadow-win98-outer bg-win98-face flex-1 min-h-0 flex flex-col">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-[6px] py-[2px] text-[11px] font-bold text-white tracking-[0.3px] flex items-center gap-1 text-shadow-win98">
              Activity
            </div>
            <div className="activity-feed p-[2px] overflow-auto flex-1">
              {activities.map(a => {
                const isNew = a.id === latestActivityId;
                return (
                  <Link
                    key={a.id}
                    href={`${EXPLORER_TX_URL}${a.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-[3px] py-[2px] border-b border-win98-highlight text-[9px] flex items-center gap-[3px] leading-[1.3] no-underline text-inherit cursor-pointer hover:bg-[#d0d0ff]"
                    style={{
                      animation: isNew ? 'activitySlideIn 0.3s ease both' : 'none',
                    }}
                  >
                    <span className="text-[#808080] font-mono text-[8px] shrink-0">{a.user}</span>
                    <span className="text-[#008000] font-bold shrink-0">{a.txType || 'bought'}</span>
                    <span className="font-bold flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{a.item}</span>
                    <span className="text-[#000080] font-mono shrink-0">{a.price}</span>
                    <span className="text-[#808080] text-[8px] shrink-0">{a.time}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="hide-scrollbar flex-1 p-[6px] flex flex-col min-w-0 overflow-auto">
          {/* <StatsBar totalListed={filtered.length} /> */}
          <ActivityTicker activities={activities} />

          {/* Toolbar */}
          <div className="flex items-center gap-1 mb-[6px] flex-wrap">
            <div className="flex gap-[1px]">
              <Btn small active={slot === 'All'} onClick={() => setSlot('All')}>All</Btn>
              {CATEGORY_ORDER.map(s => (
                <Btn key={s} small active={slot === s} onClick={() => setSlot(s)} className="capitalize">{s}</Btn>
              ))}
            </div>
            <div className="flex-1" />
            <div className="shadow-win98-inner bg-white flex items-center px-1 w-[160px]">
              <span className="text-[11px] text-[#808080] mr-[3px]">&#9906;</span>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="border-none outline-none bg-transparent text-[#000000] text-[11px] py-[3px] w-full font-[family-name:'MS_Sans_Serif',Tahoma,sans-serif]" />
            </div>
            <Win98Select
              value={sort}
              onChange={(v) => setSort(v as SortOption)}
              options={[
                { value: 'price-asc', label: 'Price \u2191' },
                { value: 'price-desc', label: 'Price \u2193' },
                { value: 'rarity', label: 'Rarity' },
                { value: 'latest', label: 'Latest' },
              ]}
              className="w-[100px]"
            />
            <div className="shadow-win98-inner bg-white py-[3px] px-2 text-[11px]">
              Results: <strong className="text-[#000080]">{filtered.length}</strong>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-1 content-start">
            {filtered.map((item, i) => (
              <EquipCard
                key={item.id} item={item} index={i}
                inCart={cart.some(c => c.id === item.id)}
                isTrying={tryOnItems.some(t => t.id === item.id)}
                onAdd={() => addToCart(item.id)}
                onRemove={() => removeFromCart(item.id)}
                onTryOn={handleTryOn}
                onPreview={setPreview}
              />
            ))}
          </div>
          {isLoadingItems && (
            <div className="flex items-center justify-center py-3 text-[11px] text-[#808080]" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
              Loading...
            </div>
          )}
          {filtered.length === 0 && !isLoadingItems && (
            <div className="flex-1 flex flex-col items-center justify-center text-[#808080] p-10">
              <div className="text-[28px] mb-[6px] opacity-30">&#9906;</div>
              No items match your filters.
            </div>
          )}
        </div>
      </div>

      {/* -- Status Bar -- */}
      <div className="h-[26px] shrink-0 shadow-[inset_0_1px_0_#fff] bg-win98-face flex items-center px-[6px] gap-[6px] border-t border-[#808080]">
        {/* Left: gas */}
        <div className="shadow-win98-inner py-[2px] px-2 flex items-center gap-1 text-[#808080]">
          <svg fill="currentColor" height="12" viewBox="0 -960 960 960" width="12" xmlns="http://www.w3.org/2000/svg">
            <path d="M160-120v-640q0-33 23.5-56.5T240-840h240q33 0 56.5 23.5T560-760v280h40q33 0 56.5 23.5T680-400v180q0 17 11.5 28.5T720-180q17 0 28.5-11.5T760-220v-288q-9 5-19 6.5t-21 1.5q-42 0-71-29t-29-71q0-32 17.5-57.5T684-694l-84-84 42-42 148 144q15 15 22.5 35t7.5 41v380q0 42-29 71t-71 29q-42 0-71-29t-29-71v-200h-60v300H160Zm80-440h240v-200H240v200Zm480 0q17 0 28.5-11.5T760-600q0-17-11.5-28.5T720-640q-17 0-28.5 11.5T680-600q0 17 11.5 28.5T720-560Z" />
          </svg>
          <span className="text-[10px] leading-none">
            <span className="font-mono">0.04</span> GWEI
          </span>
        </div>

        {/* Middle: try-on info */}
        {tryOnItems.length > 0 && (
          <div className="shadow-win98-inner py-[2px] px-2 text-[10px] flex items-center gap-1">
            <span className="text-[#8B008B]">&#9673;</span>
            <span className="text-[#404040]">Trying:</span>
            <span className="font-bold">{tryOnItems.map(i => i.name).join(', ')}</span>
            <button onClick={() => setTryOnItems([])}
              className="bg-none border-none text-[9px] text-[#cc0000] cursor-pointer font-bold">&#10005;</button>
          </div>
        )}

        <div className="flex-1" />

        {/* Right: wallet + cart */}
        <div className="shadow-win98-inner py-[2px] px-2 flex items-center gap-1 text-[10px]">
          <span
            className="w-[6px] h-[6px] rounded-full inline-block"
            style={{ background: walletStore.isConnected ? '#00aa00' : '#808080' }}
          />
          <span className="text-[#808080] font-mono">
            {walletStore.isConnected ? `${walletStore.address?.slice(0, 4)}..${walletStore.address?.slice(-3)}` : '--'}
          </span>
          <span className="text-[#808080]">|</span>
          <span className="text-[#000080] font-bold font-mono">
            {walletStore.isConnected ? `${usdcBalance.toFixed(2)} USDC` : '--'}
          </span>
        </div>
        <Btn small onClick={() => setShowCart(true)} className="relative text-[10px]">
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-[5px] -right-[5px] bg-[#cc0000] text-white text-[8px] font-bold w-[14px] h-[14px] rounded-full flex items-center justify-center shadow-[0_0_0_1px_#fff]">{cartCount}</span>
          )}
        </Btn>
        {cartCount > 0 && (
          <div className="shadow-win98-inner py-[2px] px-2 flex items-center gap-1 text-[10px]">
            <span className="text-[#000080] font-bold font-mono">{cartTotal.toFixed(2)} USDC</span>
            <span className="text-[#808080]">({cartCount})</span>
            <Btn small primary onClick={handlePurchase} disabled={isPurchasing} className="text-[10px] ml-[2px]" style={{ padding: '1px 8px' }}>Buy Now</Btn>
          </div>
        )}
      </div>

      {/* -- Purchase Step Progress -- */}
      {(purchaseStep !== "idle") && (
        <div className="absolute bottom-[32px] right-[6px] z-20 shadow-win98-outer bg-win98-face p-2 w-[220px]">
          <div className="w98-sunken bg-white p-2 space-y-1">
            <StepStatus label="Approve USDC" status={getStepStatus(purchaseStep, "approve", skippedApprove)} />
            <StepStatus label="Purchase Wearables" status={getStepStatus(purchaseStep, "purchase", skippedApprove)} />
          </div>
          {purchaseError && (
            <div className="mt-1 px-2 py-1.5 bg-red-50 border border-red-400 text-[9px]">
              <p className="font-bold text-red-700 mb-0.5">Failed</p>
              <p className="text-red-600 break-all">{purchaseError}</p>
            </div>
          )}
          {purchaseStep === "done" && (
            <div className="mt-1 px-2 py-1.5 bg-[#f0fff0] border border-[#008000] text-[9px] text-[#008000] font-bold">
              {"\u2713"} Purchase complete!
            </div>
          )}
          {(purchaseStep === "done" || purchaseError) && (
            <Btn small onClick={() => { setPurchaseStep("idle"); setPurchaseError(null); }} className="mt-1 w-full text-[9px]">
              Close
            </Btn>
          )}
        </div>
      )}

      {/* -- Modals -- */}
      {preview && (
        <EquipDetailModal
          item={preview}
          onClose={() => setPreview(null)}
          inCart={cart.some(c => c.id === preview.id)}
          isTrying={tryOnItems.some(t => t.id === preview.id)}
          onAdd={() => { addToCart(preview.id); setPreview(null); }}
          onRemove={() => { removeFromCart(preview.id); setPreview(null); }}
          onTryOn={handleTryOn}
        />
      )}
      {showCart && (
        <ShoppingCart
          cart={cart}
          items={wearableItems}
          isConnected={walletStore.isConnected}
          isPurchasing={isPurchasing}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
          onClose={() => setShowCart(false)}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
});

export default WearableMarketplaceContent;
