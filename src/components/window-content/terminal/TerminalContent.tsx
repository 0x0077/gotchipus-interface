"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { useStores } from "@stores/context";
import { CustomConnectButton } from "@/components/footer/CustomConnectButton";
import { useWindowMode } from "@/hooks/useWindowMode";
import useSWR from "swr";
import { TerminalSidebar } from "./sidebar/TerminalSidebar";
import { GotchiCollection, SessionMap } from "./gotchi/GotchiCollection";
import { GotchiDetail } from "./gotchi/GotchiDetail";
import type { PortfolioApiData } from "./gotchi/GotchiDetailHelpers";
import useChat from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { SessionWizard, SessionWizardData } from "./session/SessionWizard";
import { HookWizard } from "./hook/HookWizard";
import SummonModal from "./pharos/SummonModal";
import { useWindowRouter } from "@/hooks/useWindowRouter";
import {
  Conversation,
  fetchConversations,
  fetchConversationMessages,
  renameConversation,
  deleteConversation,
  starConversation,
  pinConversation,
  deleteMessage as deleteMessageApi,
} from "@/lib/conversation-api";

export interface ToolStep {
  tool: string;
  params?: any;
  status: 'running' | 'success' | 'error';
  result?: any;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  isCallTools?: boolean;
  agentIndex?: number;
  data?: any;
  isLoading?: boolean;
  isStreaming?: boolean;
  thinking?: string;
  isThinking?: boolean;
  toolSteps?: ToolStep[];
}

interface ChatResponse {
  is_call_tools: boolean;
  message: string;
  agent_index: number;
}

interface ListApiData {
  balance: string;
  ids: string[];
  tbaAddresses: string[];
}

// Batch balance API types
interface BatchBalanceEntry {
  address: string;
  token_address: string;
  token_id: number;
  balance: string;  // raw on-chain value; divide by 10^decimals for display
  updated_block: number;
  updated_tx_hash: string;
  created_at: string;
  updated_at: string;
  // Enriched from `tokens` table (backend join). May be absent for tokens
  // missing in the tokens table — frontend falls back to KNOWN_TOKENS.
  token_type?: string;       // "ERC20" | "ERC721" | "ERC1155"
  name?: string;
  symbol?: string;
  decimals?: number | null;  // null for NFTs
}

interface BatchBalanceResponse {
  code: number;
  status: string;
  data: {
    total: number;
    balances: Record<string, BatchBalanceEntry[]>;
  };
}

// Known token metadata on Pharos testnet — used to classify batch balance entries
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number; type: "erc20" | "nft"; logo?: string; nftType?: string }> = {
  "0x9d34ff8428bdedf591be7ed9021fca87adb6ac46": { symbol: "GOTCHI", name: "Gotchipus", type: "nft", decimals: 0, nftType: "ERC1155" },
  "0x8a027bc33e180ac2a61fb1e68f40c0c7f76a46df": { symbol: "CHI", name: ".chi Names", type: "nft", decimals: 0, nftType: "ERC721" },
  "0xC879C018dB60520F4355C26eD1a6D572cdAC1815": { symbol: "USDC", name: "USD Coin", type: "erc20", decimals: 6, logo: "/tokens/usdc.png" },
  "0xe7e84b8b4f39c507499c40b4ac199b050e2882d5": { symbol: "USDT", name: "Tether USD", type: "erc20", decimals: 6, logo: "/tokens/usdt.png" },
  "0x0c64f03eea5c30946d5c55b4b532d08ad74638a4": { symbol: "WBTC", name: "Wrapped Bitcoin", type: "erc20", decimals: 8, logo: "/tokens/wbtc.png" },
  "0x1f4b7011Ee3d53969bb67F59428a9ec0477856E9": { symbol: "WETH", name: "Wrapped Ether", type: "erc20", decimals: 18, logo: "/tokens/weth.png" },
  "0x52c48d4213107b20bc583832b0d951fb9ca8f0b0": { symbol: "WPROS", name: "Wrapped Pharos", type: "erc20", decimals: 18, logo: "/tokens/pros.png" },
};

function batchEntriesToPortfolio(entries: BatchBalanceEntry[]): PortfolioApiData {
  const erc20s: PortfolioApiData["erc20s"] = [];
  const nfts: PortfolioApiData["nfts"] = [];

  for (const entry of entries) {
    const addr = entry.token_address.toLowerCase();
    // KNOWN_TOKENS has richer fields (logo, per-project overrides), so use it
    // when present; otherwise fall through to backend-enriched metadata from
    // the `tokens` table so USDC-class (6-decimal) tokens no longer get
    // misrendered as if they were 18-decimal.
    const known = KNOWN_TOKENS[addr];
    const isNftFromBackend = entry.token_type === "ERC721" || entry.token_type === "ERC1155";
    const isNft = known ? known.type === "nft"
                : entry.token_type ? isNftFromBackend
                : entry.token_id > 0;

    if (isNft) {
      nfts.push({
        token_address: entry.token_address,
        token_type: known?.nftType || entry.token_type || "ERC721",
        name: known?.name || entry.name || "Unknown",
        symbol: known?.symbol || entry.symbol || "???",
        token_id: entry.token_id,
        amount: entry.balance,
      });
    } else {
      const decimals = known?.decimals ?? entry.decimals ?? 18;
      const formatted = (Number(entry.balance) / Math.pow(10, decimals)).toString();
      erc20s.push({
        token_address: entry.token_address,
        name: known?.name || entry.name || "Unknown Token",
        symbol: known?.symbol || entry.symbol || addr.slice(0, 6),
        balance: formatted,
        balance_raw: entry.balance,
        decimals,
        usd: 0,
        logo: known?.logo,
      });
    }
  }

  return {
    tba_address: entries[0]?.address || "",
    token_contract: "",
    token_id: 0,
    total_usd: 0,
    native: { symbol: "PHRS", balance: "0", balance_raw: "0", decimals: 18, usd: 0 },
    erc20s,
    nfts,
  };
}

const listFetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

const sessionFetcher = async (url: string, gotchiIds: number[]) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gotchi_ids: gotchiIds }),
  });
  if (!res.ok) return null;
  return res.json();
};

const TerminalContent = observer(() => {
  const { t } = useTranslation();
  const { walletStore } = useStores();
  const { isMobile } = useWindowMode();
  const { activeWindow } = useWindowRouter();
  const { login, isAuthenticated, isLoggingIn } = useAuth();

  // Trigger JWT login when terminal opens and wallet is connected
  // Only depend on wallet address (not login ref) to avoid re-triggering on every render
  useEffect(() => {
    if (walletStore.isConnected && !isAuthenticated && !isLoggingIn) {
      login();
    }
  }, [walletStore.isConnected, walletStore.address, isAuthenticated, isLoggingIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedGotchi, setSelectedGotchi] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  // Session state
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showHookWizard, setShowHookWizard] = useState(false);

  // Summon modal state
  const [summonPharosId, setSummonPharosId] = useState<string | null>(null);

  // Fetch gotchi list to get all token IDs for batch session query
  const walletAddress = walletStore.address;

  // Fetch selected gotchi name
  const detailsApiUrl = walletAddress && selectedGotchi
    ? `/api/tokens/gotchipus-details?owner=${walletAddress}&tokenId=${selectedGotchi}`
    : null;
  const { data: selectedGotchiDetails } = useSWR<{ tokenName: string | null }>(detailsApiUrl, listFetcher, {
    keepPreviousData: false,
  });
  const selectedGotchiName = selectedGotchiDetails?.tokenName || (selectedGotchi ? `Gotchipus #${selectedGotchi}` : null);
  const listApiUrl = walletAddress && walletStore.isConnected
    ? `/api/tokens/gotchipus?owner=${walletAddress}&includeGotchipusInfo=true`
    : null;

  const { data: listData, mutate: mutateList } = useSWR<ListApiData>(listApiUrl, listFetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
  });

  const gotchiIds = useMemo(
    () => (listData?.ids || []).map(Number),
    [listData?.ids]
  );

  // Fetch unsummoned Pharos NFTs
  const pharosApiUrl = walletAddress && walletStore.isConnected
    ? `/api/tokens/pharos?owner=${walletAddress}&includePharosInfo=false&format=simple`
    : null;
  const { data: pharosIds, mutate: mutatePharos } = useSWR<string[]>(
    pharosApiUrl, listFetcher, { refreshInterval: 30000, keepPreviousData: true }
  );

  // Batch session query for all gotchis
  const sessionSWRKey = walletStore.isConnected && gotchiIds.length > 0
    ? `/api/session/get?ids=${gotchiIds.slice().sort().join(',')}`
    : null;

  const { data: sessionRawData, mutate: mutateSession } = useSWR(
    sessionSWRKey,
    () => sessionFetcher('/api/session/get', gotchiIds),
    { refreshInterval: 30000 }
  );

  // Batch TBA balance query — use TBA addresses already returned by the list API
  const tbaAddressList = listData?.tbaAddresses || [];
  const validTbaAddresses = tbaAddressList.filter(Boolean);

  const tbaBalanceSWRKey = walletStore.isConnected && validTbaAddresses.length > 0
    ? `/api/tokens/tba-balances?tbaAddresses=${validTbaAddresses.join(',')}`
    : null;

  const { data: tbaBalanceData } = useSWR<{ balances: Record<string, string> }>(
    tbaBalanceSWRKey,
    listFetcher,
    { refreshInterval: 60000 }
  );

  // Remap address-keyed balances → tokenId-keyed balances
  const pharosBalances = useMemo((): Record<string, string> | undefined => {
    if (!tbaBalanceData?.balances || !listData) return undefined;
    const result: Record<string, string> = {};
    listData.ids.forEach((id, i) => {
      const addr = tbaAddressList[i];
      if (addr && tbaBalanceData.balances[addr] !== undefined) {
        result[id] = tbaBalanceData.balances[addr];
      }
    });
    return result;
  }, [tbaBalanceData, listData, tbaAddressList]);

  // Batch fetch token balances (ERC20/ERC721/ERC1155) for all TBAs
  const batchBalanceFetcher = useCallback(async (accounts: string[]) => {
    const res = await fetch("/api/balances/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts }),
    });
    if (!res.ok) return {};
    const json: BatchBalanceResponse = await res.json();
    if (json.code !== 0 || !json.data?.balances) return {};
    const result: Record<string, PortfolioApiData> = {};
    for (const [addr, entries] of Object.entries(json.data.balances)) {
      if (entries.length > 0) {
        result[addr.toLowerCase()] = batchEntriesToPortfolio(entries);
      }
    }
    return result;
  }, []);

  const portfolioSWRKey = validTbaAddresses.length > 0
    ? `batch-balances:${validTbaAddresses.slice().sort().join(',')}`
    : null;

  const { data: portfolioMap } = useSWR(
    portfolioSWRKey,
    () => batchBalanceFetcher(validTbaAddresses),
    { refreshInterval: 60000 }
  );

  // Resolve portfolio for the currently selected gotchi's TBA
  const selectedTbaAddress = selectedGotchi && listData
    ? (tbaAddressList[listData.ids.indexOf(selectedGotchi)] || "")
    : "";
  const selectedPortfolio = selectedTbaAddress
    ? portfolioMap?.[selectedTbaAddress.toLowerCase()]
    : undefined;

  // Build per-gotchi session map + detail map from API data
  const { sessionMap, sessionDetailMap } = useMemo(() => {
    const map: SessionMap = {};
    const detailMap: Record<string, SessionWizardData> = {};
    if (!sessionRawData) return { sessionMap: map, sessionDetailMap: detailMap };

    // Initialize all known IDs as "none"
    for (const id of listData?.ids || []) {
      map[id] = { status: "none", daysLeft: 0, expiresAt: 0 };
    }

    if (!sessionRawData.data || !Array.isArray(sessionRawData.data)) return { sessionMap: map, sessionDetailMap: detailMap };

    for (const item of sessionRawData.data) {
      const id = String(item.gotchi_id);
      const expiresAt = new Date(item.expires_at);
      const expiresAtMs = expiresAt.getTime();
      const isValid = item.is_active && expiresAt > new Date();
      const daysLeft = isValid
        ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 86400000))
        : 0;

      map[id] = { status: isValid ? "active" : "expired", daysLeft, expiresAt: expiresAtMs };

      // Decode enabled_options bitmap
      const bits = item.enabled_options ?? 0;
      const weiToNumber = (v: any) => {
        if (v == null) return 0;
        const n = Number(v);
        return n >= 1e15 ? n / 1e18 : n;
      };

      detailMap[id] = {
        active: isValid,
        expiresAt: expiresAtMs,
        maxPerTx: weiToNumber(item.max_value_per_tx),
        maxPerSession: weiToNumber(item.max_value_per_session),
        dailyLimit: weiToNumber(item.daily_limit),
        singleTxLimit: weiToNumber(item.single_tx_limit),
        enabledOptions: {
          blockInfiniteApproval: !!(bits & (1 << 0)),
          dailyTransferLimit: !!(bits & (1 << 1)),
          singleTxLimit: !!(bits & (1 << 2)),
          restrictTarget: !!(bits & (1 << 3)),
        },
        whitelistMode: item.whitelist_mode ?? true,
        whitelist: item.target_whitelists ?? [],
        blacklist: item.target_blacklists ?? [],
        // AI Behavior (from DB)
        risk_preference: item.risk_preference,
        slippage: item.slippage != null ? Number(item.slippage) : undefined,
        tone: item.tone,
        verbosity: item.verbosity,
        // Usage stats
        usedValue: item.used_value != null ? weiToNumber(item.used_value) : 0,
        usedToday: item.used_today != null ? weiToNumber(item.used_today) : 0,
      };
    }

    return { sessionMap: map, sessionDetailMap: detailMap };
  }, [sessionRawData, listData?.ids]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system",
      role: "system",
      content: "You are Gotchipus, an AI assistant.",
    },
  ]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [currentChatId, setCurrentChatId] = useState<string>(crypto.randomUUID());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { send: sendChatEvent, regenerate: regenerateChatEvent, edit: editChatEvent, stop: stopChatStream } = useChat();

  /** Replace the most recent user message's session-local id (Date.now()) with
   *  the DB UUID emitted via `user_message_start` SSE. Enables later edit/delete. */
  const syncLastUserMsgId = useCallback((uuid: string) => {
    setMessages(prev => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === "user") {
          if (prev[i].id === uuid) return prev;
          const next = [...prev];
          next[i] = { ...next[i], id: uuid };
          return next;
        }
      }
      return prev;
    });
  }, []);
  const isProcessingRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Conversation management state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsPage, setConversationsPage] = useState(0);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [currentConversationName, setCurrentConversationName] = useState<string | null>(null);

  useEffect(() => {
    if (chatEndRef.current && messages.length > 1) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (status === "streaming") {
      const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
      const intervalId = setInterval(scrollToBottom, 300);
      return () => clearInterval(intervalId);
    }
  }, [status]);

  // Re-fetch gotchi list every time terminal becomes the active window
  useEffect(() => {
    if (activeWindow === 'terminal' && walletStore.isConnected) {
      mutateList();
      mutateSession();
      mutatePharos();
    }
  }, [activeWindow]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    // Delay to allow backend to propagate the new session before querying
    setTimeout(() => mutateSession(), 800);
  };

  // ── Conversation management ──

  const loadConversations = useCallback(async (page = 0, append = false) => {
    if (!walletStore.userId || isLoadingConversations) return;
    setIsLoadingConversations(true);
    try {
      const res = await fetchConversations(page);
      if (res.code === 0 && res.data) {
        const list = res.data as Conversation[];
        setConversations(prev => append ? [...prev, ...list] : list);
        setConversationsPage(page);
        setHasMoreConversations(list.length >= 30);
      }
    } catch (e) {
    } finally {
      setIsLoadingConversations(false);
    }
  }, [walletStore.userId, isLoadingConversations]);

  const loadMoreConversations = useCallback(() => {
    if (hasMoreConversations) {
      loadConversations(conversationsPage + 1, true);
    }
  }, [hasMoreConversations, conversationsPage, loadConversations]);

  const handleSwitchConversation = useCallback(async (conversationId: string) => {
    if (conversationId === currentChatId) return;
    if (isProcessingRef.current) return;

    setCurrentChatId(conversationId);
    const conv = conversations.find(c => c.id === conversationId);
    setCurrentConversationName(conv?.name || null);

    // Load messages from the selected conversation
    try {
      const res = await fetchConversationMessages(conversationId);
      if (res.code === 0 && res.data) {
        const msgs: Message[] = [
          { id: "system", role: "system", content: "You are Gotchipus, an AI assistant." },
        ];
        for (const m of res.data) {
          // Restore toolSteps from attachments.tool_steps (persisted by
          // chat_engine on stream end and on user-cancelled stops).
          const persisted = m.attachments?.tool_steps;
          const toolSteps = Array.isArray(persisted)
            ? persisted.map(s => ({
                tool: s.tool,
                params: s.params,
                status: s.status || 'success',
                result: s.result,
              }))
            : undefined;
          msgs.push({
            id: m.id,
            role: m.sender as Message["role"],
            content: m.text_content || m.content || '',
            createdAt: new Date(m.created_at),
            thinking: m.thinking ?? undefined,
            toolSteps,
          });
        }
        setMessages(msgs);
      }
    } catch (e) {
    }
  }, [currentChatId]);

  const handleNewConversation = useCallback(() => {
    if (isProcessingRef.current) return;
    setCurrentChatId(crypto.randomUUID());
    setCurrentConversationName(null);
    setMessages([
      { id: "system", role: "system", content: "You are Gotchipus, an AI assistant." },
    ]);
  }, []);

  const handleRenameConversation = useCallback(async (conversationId: string, name: string) => {
    const res = await renameConversation(conversationId, name);
    if (res.code === 0) {
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, name } : c));
      if (conversationId === currentChatId) {
        setCurrentConversationName(name);
      }
    }
    return res;
  }, [currentChatId]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    const res = await deleteConversation(conversationId);
    if (res.code === 0) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      // If deleted the active conversation, start a new one
      if (conversationId === currentChatId) {
        handleNewConversation();
      }
    }
    return res;
  }, [currentChatId, handleNewConversation]);

  const handleStarConversation = useCallback(async (conversationId: string, starred: boolean) => {
    const res = await starConversation(conversationId, starred);
    if (res.code === 0) {
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, is_starred: starred } : c));
    }
    return res;
  }, []);

  const handlePinConversation = useCallback(async (conversationId: string, pinned: boolean) => {
    const res = await pinConversation(conversationId, pinned);
    if (res.code === 0) {
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, is_pinned: pinned } : c));
    }
    return res;
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const res = await deleteMessageApi(messageId);
    if (res.code === 0) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
    return res;
  }, []);

  // ── Stop streaming ──

  const handleStopStreaming = useCallback(async () => {
    if (status !== "streaming") return;
    await stopChatStream(currentChatId);
    setStatus("idle");
    isProcessingRef.current = false;
    // Mark any streaming messages as complete
    setMessages(prev => prev.map(msg =>
      msg.isStreaming ? { ...msg, isStreaming: false, isThinking: false } : msg
    ));
  }, [status, stopChatStream, currentChatId]);

  const processTextChunk = useCallback((chunk: string) => {
    let contentToAdd = chunk;
    try {
      const jsonChunk = JSON.parse(chunk);
      if (jsonChunk.content) {
        contentToAdd = jsonChunk.content;
      }
    } catch (e) {
      contentToAdd = chunk;
    }
    return contentToAdd;
  }, []);

  const createTextHandler = useCallback((messageId: string, chatResponse: ChatResponse) => {
    return (chunk: string) => {
      const contentToAdd = processTextChunk(chunk);

      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id !== messageId) return msg;

          const currentContent = msg.content || '';
          const newContent = currentContent + contentToAdd;

          return {
            ...msg,
            content: newContent,
            isCallTools: chatResponse.agent_index === 1 ? true : false,
            agentIndex: chatResponse.agent_index === 1 ? 1 : undefined,
            isLoading: false,
            isStreaming: true,
            ...(msg.agentIndex === 0 && !msg.data
              ? { isCallTools: false, agentIndex: undefined }
              : {})
          };
        });
      });
    };
  }, [processTextChunk]);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const addErrorMessage = useCallback((content: string) => {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  }, []);

  /** Prefer the real error text from backend SSE `error` events / thrown
   *  exceptions. Fall back to the generic i18n network-error string only when
   *  no usable message is present. */
  const formatChatError = useCallback((error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error) return error;
    if (error && typeof (error as { message?: unknown }).message === "string") {
      const m = (error as { message: string }).message;
      if (m) return m;
    }
    return t('terminal.networkError');
  }, [t]);

  const sendMessage = useCallback(async (message: string) => {
    if (message.trim() === "" || isProcessingRef.current) return;

    if (!walletStore.userId) {
      addErrorMessage(t('terminal.connectFirst'));
      return;
    }

    // Check if this is the first user message (only system message exists)
    const isFirstMessage = messagesRef.current.filter(m => m.role !== "system").length === 0;

    isProcessingRef.current = true;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("streaming");
    setChatInput("");

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
      isCallTools: false,
      agentIndex: 0,
      isLoading: false,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    const chatResponse: ChatResponse = {
      is_call_tools: false,
      message: "",
      agent_index: 0,
    };

    try {
      const selectedGotchiIndex = selectedGotchi !== null ? listData?.ids.indexOf(selectedGotchi) ?? -1 : -1;
      const selectedTbaAddress = selectedGotchiIndex >= 0 ? tbaAddressList[selectedGotchiIndex] || null : null;

      await sendChatEvent(
        {
          msg: message,
          gotchi_id: selectedGotchi !== null ? Number(selectedGotchi) : null,
          account: selectedTbaAddress,
          conversation_id: currentChatId,
          is_new_conversation: isFirstMessage,
          session_active: selectedGotchi ? sessionMap[selectedGotchi]?.status === 'active' : false,
        },
        {
          onUserMessageStart: syncLastUserMsgId,
          onText: (chunk) => {
            createTextHandler(assistantMessage.id, chatResponse)(chunk);
            // Once we receive content, thinking phase is done
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id && msg.isThinking
                ? { ...msg, isThinking: false }
                : msg
            ));
          },
          onThinking: (thinkingText) => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, thinking: (msg.thinking || '') + thinkingText, isThinking: true }
                : msg
            ));
          },
          onAction: (actionData) => {
            const { action, params } = actionData;

            const actionToAgentIndex: Record<string, number> = {
              'pet': 2,
              'mint': 3,
              'summon': 4,
              'wearable': 5,
              'call': 6,
              'swap': 7,
              'addLiquidity': 8,
              'removeLiquidity': 9,
            };

            const agentIndex = actionToAgentIndex[action];

            if (agentIndex) {
              updateMessage(assistantMessage.id, {
                isCallTools: true,
                agentIndex: agentIndex,
                data: { [action]: true, ...params },
              });
            }

            // Add tool step for step chain UI
            setMessages(prev => prev.map(msg => {
              if (msg.id !== assistantMessage.id) return msg;
              const steps = [...(msg.toolSteps || [])];
              steps.push({ tool: action, params, status: 'running' as const });
              return { ...msg, toolSteps: steps };
            }));
          },
          onToolResult: (resultData) => {
            setMessages(prev => prev.map(msg => {
              if (msg.id !== assistantMessage.id) return msg;
              const steps = [...(msg.toolSteps || [])];
              const idx = steps.findLastIndex(s => s.tool === resultData.tool && s.status === 'running');
              if (idx >= 0) {
                steps[idx] = {
                  ...steps[idx],
                  status: resultData.success ? 'success' : 'error',
                  result: resultData.data,
                };
              }
              return { ...msg, toolSteps: steps };
            }));
            // Refresh session & balance data after on-chain operations
            if (resultData.success && ['transfer_token', 'deploy_token'].includes(resultData.tool)) {
              setTimeout(() => { mutateSession(); mutatePharos(); }, 2000);
            }
          },
          onTextReplace: (text) => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: text }
                : msg
            ));
          },
          onError: (error) => {
            addErrorMessage(formatChatError(error));
            updateMessage(assistantMessage.id, {
              isLoading: false,
              isStreaming: false,
              isThinking: false,
            });
          },
          onComplete: () => {
            updateMessage(assistantMessage.id, { isStreaming: false, isThinking: false });
            // After first message, fetch conversation name from backend
            if (isFirstMessage && walletStore.userId) {
              fetchConversations(0).then(res => {
                if (res.code === 0 && res.data) {
                  const conv = (res.data as Conversation[]).find(c => c.id === currentChatId);
                  if (conv?.name) {
                    setCurrentConversationName(conv.name);
                  }
                }
              });
            }
          },
        }
      );
    } catch (error) {
      addErrorMessage(formatChatError(error));
      updateMessage(assistantMessage.id, {
        isLoading: false,
        isStreaming: false,
      });
    } finally {
      setStatus("idle");
      isProcessingRef.current = false;
    }
  }, [sendChatEvent, syncLastUserMsgId, createTextHandler, updateMessage, addErrorMessage, formatChatError, walletStore.userId, walletStore.address, currentChatId, selectedGotchi, sessionMap, listData, tbaAddressList]);

  const handleSendChat = (msg?: string) => {
    const text = msg || chatInput;
    if (!text.trim()) return;

    // Intercept /summon command
    const summonMatch = text.trim().match(/^\/summon\s+#?(\d+)$/i);
    if (summonMatch) {
      const id = summonMatch[1];
      setChatInput("");
      if (pharosIds?.includes(id)) {
        setSummonPharosId(id);
      } else {
        const available = pharosIds?.map(p => `#${p}`).join(", ") || "none";
        addErrorMessage(`Pharos #${id} not found in your collection. Available: ${available}`);
      }
      return;
    }

    sendMessage(text);
  };

  const handleSelectGotchi = (tokenId: string) => {
    setSelectedGotchi(tokenId);
  };

  const handleBackToCollection = () => {
    setSelectedGotchi(null);
    setMessages([]);
    setCurrentChatId(crypto.randomUUID());
  };

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (isProcessingRef.current) return;

    if (!walletStore.userId) {
      return;
    }

    const messageIndex = messagesRef.current.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    isProcessingRef.current = true;

    // Remove the old assistant message from local state
    setMessages(prev => prev.slice(0, messageIndex));

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
      isCallTools: false,
      agentIndex: 0,
      isLoading: false,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setStatus("streaming");

    const chatResponse: ChatResponse = {
      is_call_tools: false,
      message: "",
      agent_index: 0,
    };

    try {
      const regenGotchiIndex = selectedGotchi !== null ? listData?.ids.indexOf(selectedGotchi) ?? -1 : -1;
      const regenTbaAddress = regenGotchiIndex >= 0 ? tbaAddressList[regenGotchiIndex] || null : null;

      await regenerateChatEvent(
        {
          gotchi_id: selectedGotchi !== null ? Number(selectedGotchi) : null,
          account: regenTbaAddress,
          conversation_id: currentChatId,
          session_active: selectedGotchi ? sessionMap[selectedGotchi]?.status === 'active' : false,
        },
        {
          onUserMessageStart: syncLastUserMsgId,
          onText: (chunk) => {
            createTextHandler(assistantMessage.id, chatResponse)(chunk);
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id && msg.isThinking
                ? { ...msg, isThinking: false }
                : msg
            ));
          },
          onThinking: (thinkingText) => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, thinking: (msg.thinking || '') + thinkingText, isThinking: true }
                : msg
            ));
          },
          onAction: (actionData) => {
            const { action, params } = actionData;

            const actionToAgentIndex: Record<string, number> = {
              'pet': 2,
              'mint': 3,
              'summon': 4,
              'wearable': 5,
              'call': 6,
              'swap': 7,
              'addLiquidity': 8,
              'removeLiquidity': 9,
            };

            const agentIndex = actionToAgentIndex[action];

            if (agentIndex) {
              updateMessage(assistantMessage.id, {
                isCallTools: true,
                agentIndex: agentIndex,
                data: { [action]: true, ...params },
              });
            }

            setMessages(prev => prev.map(msg => {
              if (msg.id !== assistantMessage.id) return msg;
              const steps = [...(msg.toolSteps || [])];
              steps.push({ tool: action, params, status: 'running' as const });
              return { ...msg, toolSteps: steps };
            }));
          },
          onToolResult: (resultData) => {
            setMessages(prev => prev.map(msg => {
              if (msg.id !== assistantMessage.id) return msg;
              const steps = [...(msg.toolSteps || [])];
              const idx = steps.findLastIndex(s => s.tool === resultData.tool && s.status === 'running');
              if (idx >= 0) {
                steps[idx] = {
                  ...steps[idx],
                  status: resultData.success ? 'success' : 'error',
                  result: resultData.data,
                };
              }
              return { ...msg, toolSteps: steps };
            }));
            if (resultData.success && ['transfer_token', 'deploy_token'].includes(resultData.tool)) {
              setTimeout(() => { mutateSession(); mutatePharos(); }, 2000);
            }
          },
          onTextReplace: (text) => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: text }
                : msg
            ));
          },
          onError: (error) => {
            addErrorMessage(formatChatError(error));
            updateMessage(assistantMessage.id, {
              isLoading: false,
              isStreaming: false,
              isThinking: false,
            });
          },
          onComplete: () => {
            updateMessage(assistantMessage.id, { isStreaming: false, isThinking: false });
          },
        }
      );
    } catch (error) {
      addErrorMessage(formatChatError(error));
      updateMessage(assistantMessage.id, {
        isLoading: false,
        isStreaming: false,
      });
    } finally {
      setStatus("idle");
      isProcessingRef.current = false;
    }
  }, [regenerateChatEvent, syncLastUserMsgId, createTextHandler, updateMessage, addErrorMessage, formatChatError, walletStore.userId, walletStore.address, currentChatId, selectedGotchi, sessionMap, listData, tbaAddressList]);

  /** Edit a past user message: truncate local state from that row onward, kick
   *  off the `/api/chat/edit` SSE stream with the new content. Backend deletes
   *  the old row + all subsequent messages, then re-inserts at the same index
   *  and streams a fresh assistant reply. */
  const handleEditChat = useCallback(async (messageId: string, newContent: string) => {
    if (isProcessingRef.current) return;
    if (!walletStore.userId) {
      addErrorMessage(t('terminal.connectFirst'));
      return;
    }
    const trimmed = newContent.trim();
    if (!trimmed) return;

    const messageIndex = messagesRef.current.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    const target = messagesRef.current[messageIndex];
    if (target.role !== "user") return;

    isProcessingRef.current = true;

    // Optimistically reflect the truncate+replace on the client.
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };
    const newAssistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
      isCallTools: false,
      agentIndex: 0,
      isLoading: false,
      isStreaming: true,
    };
    setMessages(prev => [...prev.slice(0, messageIndex), newUserMessage, newAssistantMessage]);
    setStatus("streaming");

    const chatResponse: ChatResponse = { is_call_tools: false, message: "", agent_index: 0 };

    try {
      const editGotchiIndex = selectedGotchi !== null ? listData?.ids.indexOf(selectedGotchi) ?? -1 : -1;
      const editTbaAddress = editGotchiIndex >= 0 ? tbaAddressList[editGotchiIndex] || null : null;

      await editChatEvent(
        {
          gotchi_id: selectedGotchi !== null ? Number(selectedGotchi) : null,
          account: editTbaAddress,
          conversation_id: currentChatId,
          message_id: messageId,
          new_content: trimmed,
          session_active: selectedGotchi ? sessionMap[selectedGotchi]?.status === 'active' : false,
        },
        {
          onUserMessageStart: syncLastUserMsgId,
          onText: (chunk) => {
            createTextHandler(newAssistantMessage.id, chatResponse)(chunk);
            setMessages(prev => prev.map(msg =>
              msg.id === newAssistantMessage.id && msg.isThinking
                ? { ...msg, isThinking: false }
                : msg
            ));
          },
          onThinking: (thinkingText) => {
            setMessages(prev => prev.map(msg =>
              msg.id === newAssistantMessage.id
                ? { ...msg, thinking: (msg.thinking || '') + thinkingText, isThinking: true }
                : msg
            ));
          },
          onAction: (actionData) => {
            const { action, params } = actionData;
            setMessages(prev => prev.map(msg => {
              if (msg.id !== newAssistantMessage.id) return msg;
              const steps = [...(msg.toolSteps || [])];
              steps.push({ tool: action, params, status: 'running' as const });
              return { ...msg, toolSteps: steps };
            }));
          },
          onToolResult: (resultData) => {
            setMessages(prev => prev.map(msg => {
              if (msg.id !== newAssistantMessage.id) return msg;
              const steps = [...(msg.toolSteps || [])];
              const idx = steps.findLastIndex(s => s.tool === resultData.tool && s.status === 'running');
              if (idx >= 0) {
                steps[idx] = {
                  ...steps[idx],
                  status: resultData.success ? 'success' : 'error',
                  result: resultData.data,
                };
              }
              return { ...msg, toolSteps: steps };
            }));
            if (resultData.success && ['transfer_token', 'deploy_token'].includes(resultData.tool)) {
              setTimeout(() => { mutateSession(); mutatePharos(); }, 2000);
            }
          },
          onTextReplace: (text) => {
            setMessages(prev => prev.map(msg =>
              msg.id === newAssistantMessage.id ? { ...msg, content: text } : msg
            ));
          },
          onError: (error) => {
            addErrorMessage(formatChatError(error));
            updateMessage(newAssistantMessage.id, {
              isLoading: false,
              isStreaming: false,
              isThinking: false,
            });
          },
          onComplete: () => {
            updateMessage(newAssistantMessage.id, { isStreaming: false, isThinking: false });
          },
        }
      );
    } catch (error) {
      addErrorMessage(formatChatError(error));
      updateMessage(newAssistantMessage.id, { isLoading: false, isStreaming: false });
    } finally {
      setStatus("idle");
      isProcessingRef.current = false;
    }
  }, [editChatEvent, syncLastUserMsgId, createTextHandler, updateMessage, addErrorMessage, formatChatError, walletStore.userId, currentChatId, selectedGotchi, sessionMap, listData, tbaAddressList, t, mutateSession, mutatePharos]);

  if (!walletStore.isConnected) {
    return (
      <div className="h-full flex items-center justify-center bg-win98-face p-4">
        <div className="text-center win98-bezel-inset p-8 bg-win98-face">
          <div className="mb-4">
            <div className="text-6xl mb-4"></div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#000080]">{t('terminal.noWallet')}</h3>
          <p className="text-[#000080] mb-4 text-sm">
            {t('terminal.noWalletDesc')}
          </p>
          <div className="mt-4">
            <CustomConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-win98-face flex overflow-hidden relative">
      {/* Left: Main Content - 2/3 width */}
      <div className="flex-[2] flex flex-col overflow-hidden">
        {!selectedGotchi ? (
          <GotchiCollection
            onSelectGotchi={handleSelectGotchi}
            sessionMap={sessionMap}
            pharosBalances={pharosBalances}
            pharosIds={pharosIds || []}
            pharosLoading={!pharosIds && !!pharosApiUrl}
            onSummonPharos={(id) => setSummonPharosId(id)}
          />
        ) : (
          <GotchiDetail
            tokenId={selectedGotchi}
            onBack={handleBackToCollection}
            onOpenSetup={() => setShowSetupWizard(true)}
            onOpenHooks={() => setShowHookWizard(true)}
            sessionStatus={sessionMap[selectedGotchi]?.status ?? null}
            sessionDaysLeft={sessionMap[selectedGotchi]?.daysLeft ?? 0}
            sessionInfo={sessionDetailMap[selectedGotchi] ?? null}
            pharosBalance={pharosBalances?.[selectedGotchi]}
            portfolioData={selectedPortfolio}
          />
        )}
      </div>

      {/* Right: Sidebar - 1/3 width */}
      {!isMobile && (
        <TerminalSidebar
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendChat={handleSendChat}
          chatEndRef={chatEndRef}
          status={status}
          selectedGotchi={selectedGotchi}
          selectedGotchiName={selectedGotchiName}
          selectedTbaAddress={selectedTbaAddress || null}
          sessionStatus={selectedGotchi ? (sessionMap[selectedGotchi]?.status ?? null) : null}
          sessionDaysLeft={selectedGotchi ? (sessionMap[selectedGotchi]?.daysLeft ?? 0) : 0}
          sessionExpiresAt={selectedGotchi ? (sessionMap[selectedGotchi]?.expiresAt ?? 0) : 0}
          onOpenSetup={selectedGotchi ? () => setShowSetupWizard(true) : undefined}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditChat}
          onStopStreaming={handleStopStreaming}
          currentConversationName={currentConversationName}
          conversations={conversations}
          currentConversationId={currentChatId}
          onSwitchConversation={handleSwitchConversation}
          onNewConversation={handleNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onStarConversation={handleStarConversation}
          onPinConversation={handlePinConversation}
          onDeleteMessage={handleDeleteMessage}
          onLoadConversations={loadConversations}
          onLoadMoreConversations={loadMoreConversations}
          hasMoreConversations={hasMoreConversations}
          isLoadingConversations={isLoadingConversations}
        />
      )}

      {/* Session Setup Wizard modal */}
      {showSetupWizard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <SessionWizard
            tokenId={selectedGotchi ?? undefined}
            onComplete={handleSetupComplete}
            onClose={() => setShowSetupWizard(false)}
          />
        </div>
      )}

      {/* Hook Wizard modal */}
      {showHookWizard && selectedGotchi && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <HookWizard
            tokenId={selectedGotchi}
            onClose={() => setShowHookWizard(false)}
          />
        </div>
      )}

      {/* Summon Gotchipus modal */}
      {summonPharosId && (
        <SummonModal
          pharosId={summonPharosId}
          onClose={() => setSummonPharosId(null)}
          onSummonComplete={() => {
            setSummonPharosId(null);
            mutateList();
            mutatePharos();
          }}
        />
      )}
    </div>
  );
});

export default TerminalContent;
