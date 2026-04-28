import { useState } from 'react';
import { useAccount, useSignTypedData, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { waitForTransactionReceipt } from '@wagmi/core';
import { useStores } from '@stores/context';
import { PUS_ABI, PUS_ADDRESS } from '@/src/app/blockchain';
import { config } from '@/src/lib/wagmi';

const domain = {
  name: 'Gotchipus',
  version: 'v0.1.0',
  chainId: 1672,
  verifyingContract: PUS_ADDRESS,
} as const;

const types = {
  SessionKey: [
    { name: 'tokenId', type: 'uint256' },
    { name: 'user', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;

export type CreationStep = 'idle' | 'signing' | 'contract' | 'confirming' | 'api' | 'done';

export interface SessionKeyData {
  selectedNFTId: string;
  sessionKeySettings: {
    expirationDays: number;
    maxPerTx: number;
    maxPerSession: number;
    dailyLimit: number;
    singleTxLimit: number;
  };
  securitySettings: {
    enabledOptionsBits: bigint;
    whitelistMode: boolean;
    whitelist: string[];
    blacklist: string[];
  };
  behaviorSettings: {
    risk_preference: string;
    slippage: number;
    tone: string;
    verbosity: string;
  };
}

interface UseCreateSessionKeyProps {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useCreateSessionKey = ({ onSuccess, onError }: UseCreateSessionKeyProps = {}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [existingSession, setExistingSession] = useState<any>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { walletStore } = useStores();
  const { writeContractAsync } = useWriteContract();

  const checkExistingSession = async (tokenId?: string) => {
    if (!tokenId) return;

    try {
      const response = await fetch('/api/session/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gotchi_ids: [parseInt(tokenId)] }),
      });

      if (response.ok) {
        const data = await response.json();

        const sessionData = data.data && Array.isArray(data.data) && data.data.length > 0
          ? data.data[0]
          : null;

        if (sessionData) {
          const expiresAt = new Date(sessionData.expires_at);
          const now = new Date();

          if (sessionData.is_active && expiresAt > now) {
            setExistingSession(sessionData);
          }
        }
      }
    } catch (err) {
    }
  };

  const createSessionKey = async (setupData: SessionKeyData) => {
    if (!isConnected || !address) {
      const connectError = new Error("Wallet not connected.");
      setError(connectError);
      onError?.(connectError);
      return;
    }

    if (!walletStore.userId) {
      const userIdError = new Error("User information not loaded. Please wait a moment and try again.");
      setError(userIdError);
      onError?.(userIdError);
      return;
    }

    setIsCreating(true);
    setError(null);
    setTxHash(undefined);

    try {
      // Step 0: Generate ephemeral keypair from backend
      setCreationStep('signing');
      const keygenRes = await fetch('/api/session/keygen', { method: 'POST' });
      const keygenData = await keygenRes.json();
      if (keygenData.code !== 0 || !keygenData.data?.address || !keygenData.data?.secret) {
        throw new Error('Failed to generate ephemeral session key');
      }
      const ephemeralAddress = keygenData.data.address as `0x${string}`;
      const ephemeralSecret = keygenData.data.secret as string;

      // Step 1: EIP-712 signature
      const timestamp = Math.floor(Date.now() / 1000);

      const message = {
        tokenId: BigInt(setupData.selectedNFTId),
        user: address,
        timestamp: BigInt(timestamp),
      };

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'SessionKey',
        message,
      });

      // Step 2: Call createSession on-chain with ephemeral address
      setCreationStep('contract');
      const { enabledOptionsBits, whitelistMode, whitelist, blacklist } = setupData.securitySettings;
      const { expirationDays, maxPerTx, maxPerSession, dailyLimit, singleTxLimit } = setupData.sessionKeySettings;
      const duration = expirationDays * 86400;

      const hash = await writeContractAsync({
        address: PUS_ADDRESS as `0x${string}`,
        abi: PUS_ABI,
        functionName: 'createSession',
        args: [
          BigInt(setupData.selectedNFTId),
          ephemeralAddress,
          duration,
          parseEther(maxPerTx.toString()),
          parseEther(maxPerSession.toString()),
          parseEther(dailyLimit.toString()),
          parseEther(singleTxLimit.toString()),
          enabledOptionsBits,
          whitelistMode,
          whitelist as `0x${string}`[],
          blacklist as `0x${string}`[],
        ],
      });

      setTxHash(hash);

      // Step 3: Wait for transaction confirmation
      setCreationStep('confirming');
      const receipt = await waitForTransactionReceipt(config, { hash });

      // Step 4: Save session to database with ephemeral secret
      setCreationStep('api');
      const nonce = `gotchi-${address}`;
      const user_agent = typeof window !== 'undefined' ? window.navigator.userAgent : '';

      const payload = {
        user_id: walletStore.userId || '',
        sender: address,
        signature,
        token_id: parseInt(setupData.selectedNFTId),
        timestamp,
        token: ephemeralSecret,
        nonce,
        user_agent,
        tx_hash: hash,
        // Session limits (uint256 as string, in wei)
        max_value_per_tx: parseEther(maxPerTx.toString()).toString(),
        max_value_per_session: parseEther(maxPerSession.toString()).toString(),
        // SecurityPolicy
        enabled_options: Number(enabledOptionsBits),
        daily_limit: parseEther(dailyLimit.toString()).toString(),
        single_tx_limit: parseEther(singleTxLimit.toString()).toString(),
        whitelist_mode: whitelistMode,
        target_whitelists: whitelist,
        target_blacklists: blacklist,
        // AI Behavior
        risk_preference: setupData.behaviorSettings.risk_preference,
        slippage: setupData.behaviorSettings.slippage,
        tone: setupData.behaviorSettings.tone,
        verbosity: setupData.behaviorSettings.verbosity,
      };

      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 0 || data.data !== true) {
        throw new Error(data.message || 'Failed to save session to database.');
      }

      // Done
      setCreationStep('done');
      setExistingSession(null);

      onSuccess?.({
        signature,
        address,
        timestamp,
        setupData,
        verified: true,
        txHash: hash,
        receipt,
      });
    } catch (err: any) {
      setError(err);
      onError?.(err);
    } finally {
      setIsCreating(false);
      setCreationStep('idle');
    }
  };

  return {
    createSessionKey,
    isCreating,
    creationStep,
    error,
    isReady: isConnected && !!address && !!walletStore.userId,
    existingSession,
    checkExistingSession,
    txHash,
  };
};
