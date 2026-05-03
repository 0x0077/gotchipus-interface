'use client';

import { useWalletStore } from "@/hooks/useWalletStore";
import { useEffect } from "react";
import { getToken, removeToken } from "@/lib/auth";

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { isConnected, walletStore } = useWalletStore();

  // Restore cached token and userId on reconnect
  useEffect(() => {
    if (!isConnected || !walletStore.address) return;

    const existingToken = getToken();
    const cacheKey = `userId_${walletStore.address.toLowerCase()}`;
    const cachedUserId = localStorage.getItem(cacheKey);

    if (existingToken && cachedUserId) {
      walletStore.setAuth(existingToken, cachedUserId);
    }
  }, [isConnected, walletStore]);

  // Clean up on disconnect
  useEffect(() => {
    if (!isConnected) {
      removeToken();
      walletStore.reset();
    }
  }, [isConnected, walletStore]);

  return <>{children}</>;
};
