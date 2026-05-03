'use client';

import { useWalletStore } from "@/hooks/useWalletStore";
import { useEffect } from "react";
import { getToken } from "@/lib/auth";

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { isConnected, walletStore } = useWalletStore();

  useEffect(() => {
    if (!isConnected || !walletStore.address) return;

    const existingToken = getToken();
    const cacheKey = `userId_${walletStore.address.toLowerCase()}`;
    const cachedUserId = localStorage.getItem(cacheKey);

    if (existingToken && cachedUserId) {
      walletStore.setAuth(existingToken, cachedUserId);
    }
  }, [isConnected, walletStore]);

  useEffect(() => {
    if (!isConnected) {
      walletStore.setDisconnected();
    }
  }, [isConnected, walletStore]);

  return <>{children}</>;
};
