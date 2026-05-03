"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStores } from "@stores/context";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useWindowMode } from "@/hooks/useWindowMode";
import { Win98Loading } from "@/components/ui/win98-loading";
import { GotchipusInfo, EquipWearableType } from "@/lib/types";
import { useContractRead, useContractWrite, useChiRegistryRead } from "@/hooks/useContract";
import { useToast } from "@/hooks/use-toast";
import { useSvgLayers } from "@/hooks/useSvgLayers";
import { getPharosNativeBalance } from "@/src/utils/contractHepler";
import { ethers } from "ethers";
import { TOKEN_ID_TO_IMAGE, KEY_TO_CONFIG_MAP, WearableCategoryKey, TOTAL_WEARABLES } from "@/components/gotchiSvg/config";
import { BG_BYTES32, BODY_BYTES32, EYE_BYTES32, HAND_BYTES32, HEAD_BYTES32, CLOTHES_BYTES32, FACE_BYTES32, MOUTH_BYTES32 } from "@/lib/constant";
import { getWearableName, getWearablePngUrl, WearableType } from "@/src/utils/wearableMapping";
import EquipSelectWindow from "@/components/window-content/equip/EquipSelectWindow";
import RightIcon from "@assets/icons/rightIcon";
import { EquipSlotData, TokenItem, NftCollection, PortfolioApiData, resolveTokenLogo } from "./GotchiDetailHelpers";
import { GotchiPreviewPanel } from "./GotchiPreviewPanel";
import { WalletOverviewPanel } from "./WalletOverviewPanel";
import { SessionWizardData } from "../session/SessionWizard";
import { AttributesPanel } from "./AttributesPanel";
import { GenesTbaPanel } from "./GenesTbaPanel";
import { TbaAssetsPanel } from "./TbaAssetsPanel";
import { AvatarPreviewModal } from "./AvatarPreviewModal";
import { ShareCardModal } from "./ShareCardModal";
import { RenameModal } from "./RenameModal";

interface GotchiDetailProps {
  tokenId: string;
  onBack: () => void;
  onOpenSetup?: () => void;
  onOpenHooks?: () => void;
  sessionStatus?: "none" | "active" | "expired" | null;
  sessionDaysLeft?: number;
  sessionInfo?: SessionWizardData | null;
  pharosBalance?: string;
  portfolioData?: PortfolioApiData;
}

interface DetailsApiData {
  info: GotchipusInfo;
  tokenBoundAccount: string | null;
  tokenName: string | null;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

const WEARABLE_TYPE_MAP: Record<string, WearableType> = {
  head: 'heads', hand: 'hands', clothes: 'clothes',
  face: 'faces', mouth: 'mouths', background: 'backgrounds',
  body: 'bodys', eye: 'eyes',
};

const EQUIPMENT_SLOTS_DEF = [
  { name: "BG",   fullName: "Background", type: BG_BYTES32,      canEquip: false },
  { name: "Body", fullName: "Body",       type: BODY_BYTES32,    canEquip: false },
  { name: "Eye",  fullName: "Eye",        type: EYE_BYTES32,     canEquip: false },
  { name: "Hand", fullName: "Hand",       type: HAND_BYTES32,    canEquip: true  },
  { name: "Head", fullName: "Head",       type: HEAD_BYTES32,    canEquip: true  },
  { name: "Suit", fullName: "Clothes",    type: CLOTHES_BYTES32, canEquip: true  },
  { name: "Face", fullName: "Face",       type: FACE_BYTES32,    canEquip: true  },
  { name: "Oral", fullName: "Mouth",      type: MOUTH_BYTES32,   canEquip: true  },
] as const;

const RARITY_NAMES: Record<number, string> = { 0: "Common", 1: "Rare", 2: "Epic", 3: "Legendary" };
const FACTION_NAMES: Record<number, string> = { 0: "COMBAT", 1: "DEFENSE", 2: "TECHNOLOGY" };

export const GotchiDetail = observer(({ tokenId, onBack, onOpenSetup, onOpenHooks, sessionStatus, sessionDaysLeft, sessionInfo, pharosBalance: pharosBalanceProp, portfolioData: portfolioProp }: GotchiDetailProps) => {
  const { t } = useTranslation();
  const { walletStore, wearableStore } = useStores();
  const { toast } = useToast();
  const { width } = useWindowMode();
  const compact = width !== null && width < 720;

  const [pusName, setPusName] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState<{ index: number; type: string } | null>(null);
  const [isUnequipping, setIsUnequipping] = useState(false);
  const [unequippingSlotIndex, setUnequippingSlotIndex] = useState<number | null>(null);
  const [wearableBalances, setWearableBalances] = useState<string[]>([]);
  const [pharosBalance, setPharosBalance] = useState<string>("0");
  const [copiedField, setCopiedField] = useState<"tba" | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showChiMenu, setShowChiMenu] = useState(false);
  const [chiLinkCopied, setChiLinkCopied] = useState(false);

  const handleCopy = (text: string, field: "tba") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const detailsApiUrl = walletStore.address
    ? `/api/tokens/gotchipus-details?owner=${walletStore.address}&tokenId=${tokenId}`
    : null;

  const { data: detailsData, isLoading, mutate: mutateDetails } = useSWR<DetailsApiData>(detailsApiUrl, fetcher);

  const tokenInfo = detailsData?.info;
  const tbaAddress = detailsData?.tokenBoundAccount || "";

  const portfolio = portfolioProp;
  const portfolioError = false;

  const { data: networkStatsRes } = useSWR<{ data: { price: number } }>(
    '/api/tokens/network-stats',
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );
  const prosPrice = networkStatsRes?.data?.price ?? 0;

  const { data: wearableTypeInfosData } = useContractRead(
    'getAllEquipWearableType',
    [tokenId],
    { enabled: !!tokenId }
  );

  const wearableTypeInfos = wearableTypeInfosData as EquipWearableType[] | undefined;
  const { wearableIndices, isLoading: isSvgLoading } = useSvgLayers(tokenId);

  const bgUrl = wearableIndices.backgroundIndex > 0
    ? getWearablePngUrl('backgrounds', wearableIndices.backgroundIndex - 1)
    : null;
  const previewBgStyle: React.CSSProperties = bgUrl
    ? {
        backgroundImage: `url("${bgUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "#000040",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      };

  const { contractWrite: petWrite, hash: petHash, isConfirmed: isPetConfirmed, error: petError, isPending: isPetWriting } = useContractWrite();
  const { contractWrite: unequipWrite, isConfirmed: isUnequipConfirmed, error: unequipError } = useContractWrite();

  const owners = new Array(TOTAL_WEARABLES).fill(walletStore.address);
  const tokenIds = Array.from({ length: TOTAL_WEARABLES }, (_, i) => i);
  const { data: balancesData } = useContractRead("wearableBalanceOfBatch", [owners, tokenIds]);

  const tbaOwners = useMemo(() => tbaAddress ? new Array(TOTAL_WEARABLES).fill(tbaAddress) : [], [tbaAddress]);
  const tbaTokenIds = useMemo(() => Array.from({ length: TOTAL_WEARABLES }, (_, i) => i), []);
  const { data: tbaWearableBalances } = useContractRead(
    "wearableBalanceOfBatch",
    [tbaOwners, tbaTokenIds],
    { enabled: !!tbaAddress }
  );
  const { data: rawAttrs } = useContractRead("getAttributes", [tokenId], { enabled: !!tokenId });
  const onChainAttrs = useMemo(() => {
    if (!rawAttrs) return undefined;
    return (rawAttrs as bigint[]).map((v) => Math.round(Number(v) / 100));
  }, [rawAttrs]);

  const { data: tbaChiNames } = useChiRegistryRead(
    "namesOfOwner",
    [tbaAddress],
    { enabled: !!tbaAddress }
  );

  useEffect(() => {
    if (detailsData?.tokenName) {
      setPusName(detailsData.tokenName);
    } else if (tokenId) {
      setPusName(`Gotchipus #${tokenId}`);
    }
  }, [detailsData?.tokenName, tokenId]);

  useEffect(() => {
    if (wearableStore.isRefreshing) {
      mutateDetails();
      wearableStore.setIsRefreshing(false);
    }
  }, [wearableStore.isRefreshing, mutateDetails, wearableStore]);

  useEffect(() => {
    if (balancesData) setWearableBalances(balancesData as string[]);
  }, [balancesData]);

  useEffect(() => {
    if (isUnequipConfirmed && isUnequipping) {
      setIsUnequipping(false);
      setUnequippingSlotIndex(null);
      setTimeout(() => wearableStore.setIsRefreshing(true), 500);
      toast({ title: t('toast.unequipSuccess'), description: t('toast.unequipSuccessDesc') });
    }
  }, [isUnequipConfirmed, isUnequipping, wearableStore, toast]);

  useEffect(() => {
    if (unequipError && isUnequipping) {
      setIsUnequipping(false);
      setUnequippingSlotIndex(null);
      toast({ title: t('toast.unequipFailed'), description: t('toast.unequipFailedDesc'), variant: "destructive" });
    }
  }, [unequipError, isUnequipping, toast]);

  useEffect(() => {
    if (isPetConfirmed && petHash) {
      mutateDetails();
      toast({ title: t('toast.petSuccess'), description: t('toast.petSuccessDesc') });
    }
  }, [isPetConfirmed, petHash, mutateDetails, toast]);

  useEffect(() => {
    if (petError) {
      toast({ title: t('toast.petFailed'), description: t('toast.petFailedDesc'), variant: "destructive" });
    }
  }, [petError, toast]);

  useEffect(() => {
    if (pharosBalanceProp !== undefined) {
      setPharosBalance(pharosBalanceProp);
      return;
    }
    if (!tbaAddress) return;
    const fetchBalance = async () => {
      try {
        const balance = await getPharosNativeBalance(tbaAddress);
        setPharosBalance(ethers.formatEther(balance));
      } catch {
        setPharosBalance("0");
      }
    };
    fetchBalance();
  }, [tbaAddress, pharosBalanceProp]);

  const handlePet = () => {
    petWrite("pet", [tokenId]);
    toast({ title: t('toast.petTxSubmitted'), description: t('toast.petTxSubmittedDesc') });
  };

  const handleUnequip = (slotIndex: number, wearableId: number, wearableType: string) => {
    setIsUnequipping(true);
    setUnequippingSlotIndex(slotIndex);
    unequipWrite("unequipWearable", [tokenId, wearableId, wearableType]);
    toast({ title: t('toast.unequipTxSubmitted'), description: t('toast.unequipTxSubmittedDesc') });
  };

  const equippedSlots: EquipSlotData[] = useMemo(() => {
    return EQUIPMENT_SLOTS_DEF.map(slotDef => {
      if (!wearableTypeInfos || !Array.isArray(wearableTypeInfos)) return { ...slotDef, equipped: null };
      const found = wearableTypeInfos.find(w => w.equiped && w.wearableType === slotDef.type);
      if (!found) return { ...slotDef, equipped: null };

      const wTokenId = Number(found.wearableId);
      if (wTokenId === 0 && !found.equiped) return { ...slotDef, equipped: null };
      const imagePath = TOKEN_ID_TO_IMAGE[wTokenId] || null;
      const config = KEY_TO_CONFIG_MAP[slotDef.type as WearableCategoryKey];
      const wType = config ? WEARABLE_TYPE_MAP[config.name] : undefined;
      const name = wType && config ? getWearableName(wType, wTokenId - config.offset) : null;

      return { ...slotDef, equipped: { tokenId: wTokenId, imagePath, name } };
    });
  }, [wearableTypeInfos]);

  const currentExp = Number(tokenInfo?.currentExp || 0);
  const level = Math.floor(currentExp / 100);
  const expInLevel = Math.floor(((currentExp / 100) % 1) * 100);
  const rarityName = RARITY_NAMES[tokenInfo?.rarity ?? 0] || "Common";
  const factionName = FACTION_NAMES[tokenInfo?.faction ?? -1] ?? "—";

  const totalValue = parseFloat(pharosBalance) || 0;
  const totalUsd = totalValue * prosPrice;

  const tokens: TokenItem[] = useMemo(() => {
    const list: TokenItem[] = [
      { symbol: "PROS", name: "Pharos Token", amount: totalValue, usd: totalUsd, logoPath: "/tokens/pros.png", contract: "native" },
    ];
    const STABLES = new Set(["USDC", "USDT", "DAI", "USDE"]);
    if (portfolio?.erc20s) {
      for (const erc20 of portfolio.erc20s) {
        const sym = (erc20.symbol || "").toUpperCase();
        const isNativePros =
          sym === "PROS" ||
          erc20.token_address?.toLowerCase() === "0x0000000000000000000000000000000000000000";
        if (isNativePros) continue;

        const amount = parseFloat(erc20.balance) || 0;
        let usd = erc20.usd || 0;
        if (STABLES.has(sym)) usd = amount;
        else if (sym === "WPROS") usd = amount * prosPrice;

        list.push({
          symbol: erc20.symbol,
          name: erc20.name,
          amount,
          usd,
          logoPath: resolveTokenLogo(erc20.token_address, erc20.symbol, erc20.logo),
          contract: erc20.token_address,
        });
      }
    }
    return list;
  }, [totalValue, totalUsd, portfolio, prosPrice]);

  const nftCollections: NftCollection[] = useMemo(() => {
    if (portfolio && !portfolioError) {
      const grouped: Record<string, { type: string; name: string; items: NftCollection["items"] }> = {};
      for (const nft of portfolio.nfts) {
        const key = nft.token_address.toLowerCase();
        const isWearable = nft.token_type === "ERC1155" && nft.symbol === "GOTCHI";
        const isChi = nft.symbol === "CHI";
        if (!grouped[key]) {
          const type = isWearable ? "wearable" : isChi ? "chiname" : key;
          const label = isWearable ? "Wearables" : isChi ? ".chi Names" : (nft.name || nft.symbol);
          grouped[key] = { type, name: label, items: [] };
        }
        const imagePath = isWearable ? (TOKEN_ID_TO_IMAGE[nft.token_id] || null) : null;
        grouped[key].items.push({
          tokenId: nft.token_id,
          name: isWearable ? `Wearable #${nft.token_id}` : isChi ? `CHI #${nft.token_id}` : `${nft.name} #${nft.token_id}`,
          imagePath,
        });
      }
      return Object.values(grouped).map(g => ({ type: g.type, label: g.name, items: g.items }));
    }

    const collections: NftCollection[] = [];
    if (tbaWearableBalances && Array.isArray(tbaWearableBalances)) {
      const wearableItems: NftCollection["items"] = [];
      for (let i = 0; i < TOTAL_WEARABLES; i++) {
        const count = Number(tbaWearableBalances[i] ?? 0);
        if (count > 0) {
          const imagePath = TOKEN_ID_TO_IMAGE[i] || null;
          wearableItems.push({ tokenId: i, name: `Wearable #${i}`, imagePath });
        }
      }
      if (wearableItems.length > 0) {
        collections.push({ type: "wearable", label: "Wearables", items: wearableItems });
      }
    }
    if (tbaChiNames && Array.isArray(tbaChiNames)) {
      const names = tbaChiNames as string[];
      if (names.length > 0) {
        const chiItems: NftCollection["items"] = names.map((name, i) => ({
          tokenId: i,
          name: `${name}.chi`,
          imagePath: null,
        }));
        collections.push({ type: "chiname", label: ".chi Names", items: chiItems });
      }
    }
    return collections;
  }, [portfolio, portfolioError, tbaWearableBalances, tbaChiNames]);

  if (isLoading || !tokenInfo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-win98-face">
        <Win98Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-win98-face">
      {/* Header Bar */}
      <div className={`py-1.5 flex items-center border-b border-[#808080] bg-win98-face min-w-0 ${compact ? 'px-1.5 gap-1' : 'px-2 gap-2'}`}>
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className={`py-1 text-xs border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face text-[#000000] hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center gap-1 flex-shrink-0 ${compact ? 'px-2' : 'px-4'}`}
        >
          <RightIcon width={14} height={14} color="#000000" style={{ transform: "rotate(180deg)" }} />
          {!compact && t('common.back')}
        </button>
        <div className="flex-1" />
        {!compact && (
          <div className="px-2 py-0.5 border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] bg-win98-face text-xs">
            {t('taskbar.viewing', { name: `Gotchipus`, id: tokenId })}
          </div>
        )}
        <button
          onClick={() => setShowAvatarModal(true)}
          aria-label={t('terminal.detail.downloadPfp')}
          title={t('terminal.detail.downloadPfp')}
          className={`py-1 text-xs border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face text-[#000000] hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center gap-1 flex-shrink-0 ${compact ? 'px-2' : 'px-3'}`}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="14" height="14" rx="1" stroke="#000" strokeWidth="1.5"/>
            <circle cx="5.5" cy="5.5" r="1.5" fill="#000"/>
            <path d="M1 12l4-4 2 2 3-3 5 5" stroke="#000" strokeWidth="1.2" fill="none"/>
          </svg>
          {!compact && t('terminal.detail.downloadPfp')}
        </button>
        <button
          onClick={() => setShowShareCard(true)}
          aria-label={t('terminal.detail.shareCard', { defaultValue: 'Share Card' })}
          title={t('terminal.detail.shareCard', { defaultValue: 'Share Card' })}
          className={`py-1 text-xs border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face text-[#000000] hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center gap-1 flex-shrink-0 ${compact ? 'px-2' : 'px-3'}`}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1v9M5 4l3-3 3 3M2 10v4h12v-4" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!compact && t('terminal.detail.shareCard', { defaultValue: 'Share Card' })}
        </button>
        {detailsData?.tokenName && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowChiMenu(prev => !prev)}
              aria-label="chi.page"
              title="chi.page"
              className={`py-1 text-xs border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face text-[#000000] hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center gap-1 ${compact ? 'px-2' : 'px-3'}`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="6.5" stroke="#000" strokeWidth="1.5"/>
                <path d="M2 8h12M8 2c-2 2-2 4-2 6s0 4 2 6M8 2c2 2 2 4 2 6s0 4-2 6" stroke="#000" strokeWidth="1" fill="none"/>
              </svg>
              {compact ? '▾' : 'chi.page ▾'}
            </button>
            {showChiMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChiMenu(false)} />
                <div className="absolute right-0 top-full mt-0.5 z-50 w-[160px] win98-bezel shadow-[2px_2px_0_#000] bg-win98-face text-xs">
                  <button
                    onClick={() => { window.open(`https://${detailsData.tokenName}.chi.page`, '_blank'); setShowChiMenu(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 2h5v5M14 2L7 9M6 4H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('chiPageWizard.visit', { defaultValue: 'Visit Page' })}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${detailsData!.tokenName}.chi.page`);
                      setChiLinkCopied(true);
                      setTimeout(() => setChiLinkCopied(false), 1500);
                      setShowChiMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    {chiLinkCopied
                      ? t('chiPageWizard.copied', { defaultValue: 'Copied!' })
                      : t('chiPageWizard.copyLink', { defaultValue: 'Copy Link' })}
                  </button>
                  <div className="border-t border-[#808080] mx-1" />
                  <button
                    onClick={() => {
                      const url = `https://${detailsData!.tokenName}.chi.page`;
                      const text = `Check out my Gotchipus profile on {.chi}!\n\n${url}\n\n #NFT #Web3 #Pharos`;
                      window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank');
                      setShowChiMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    {t('chiPageWizard.shareToX', { defaultValue: 'Share to X' })}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-1.5">
        <div className={`grid items-start gap-1.5 mb-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-[1fr_1.5fr]'}`}>
          <div className="self-start">
          <GotchiPreviewPanel
            tokenId={tokenId}
            pusName={pusName}
            onRename={() => setShowRenameModal(true)}
            handlePet={handlePet}
            isPetWriting={isPetWriting}
            factionName={factionName}
            rarityName={rarityName}
            level={level}
            expInLevel={expInLevel}
            previewBgStyle={previewBgStyle}
            isSvgLoading={isSvgLoading}
            wearableIndices={wearableIndices}
            equippedSlots={equippedSlots}
            isUnequipping={isUnequipping}
            unequippingSlotIndex={unequippingSlotIndex}
            onEquip={(i, type) => setSelectedEquipSlot({ index: i, type })}
            onUnequip={handleUnequip}
            onOpenSetup={onOpenSetup}
          />
          </div>
          <WalletOverviewPanel
            totalValue={totalValue}
            totalUsd={totalUsd}
            tokens={tokens}
            nftCount={nftCollections.reduce((sum, c) => sum + c.items.length, 0)}
            sessionStatus={sessionStatus}
            sessionDaysLeft={sessionDaysLeft}
            sessionInfo={sessionInfo}
            onOpenSetup={onOpenSetup}
            onOpenHooks={onOpenHooks}
          />
        </div>

        <div className={`grid gap-1.5 mb-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <AttributesPanel tokenId={tokenId} />
          <GenesTbaPanel
            tbaAddress={tbaAddress}
            copiedField={copiedField}
            onCopy={handleCopy}
          />
        </div>

        {/* Row 3: TBA Assets */}
        <TbaAssetsPanel
          tokens={tokens}
          nftCollections={nftCollections}
          tbaAddress={tbaAddress}
          totalUsd={totalUsd}
        />
      </div>

      {/* Equip selector modal */}
      {selectedEquipSlot !== null && (
        <EquipSelectWindow
          onClose={() => setSelectedEquipSlot(null)}
          wearableBalances={wearableBalances}
          selectedType={selectedEquipSlot.type}
          selectedTokenId={tokenId}
        />
      )}

      {showRenameModal && (
        <RenameModal
          tokenId={tokenId}
          currentName={pusName}
          onClose={() => setShowRenameModal(false)}
          onSuccess={() => {
            setShowRenameModal(false);
            mutateDetails();
          }}
        />
      )}

      {showAvatarModal && (
        <AvatarPreviewModal
          wearableIndices={wearableIndices}
          pusName={pusName}
          tokenId={tokenId}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      {showShareCard && tokenInfo && (
        <ShareCardModal
          wearableIndices={wearableIndices}
          pusName={pusName}
          tokenId={tokenId}
          tokenInfo={tokenInfo}
          tbaAddress={tbaAddress}
          attributes={onChainAttrs}
          onClose={() => setShowShareCard(false)}
        />
      )}

    </div>
  );
});