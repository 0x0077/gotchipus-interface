import { useState, useCallback, useRef } from 'react';
import { useSignTypedData } from 'wagmi';
import { useStores } from '@stores/context';
import { getToken, setToken, removeToken } from '@/lib/auth';
import { PUS_ADDRESS } from '../app/blockchain';

const LOGIN_DOMAIN = {
  name: 'Gotchipus',
  version: 'v0.1.0',
  chainId: 1672,
  verifyingContract: PUS_ADDRESS,
} as const;

const LOGIN_TYPES = {
  SessionAuth: [
    { name: 'action', type: 'string' },
    { name: 'user', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;

const LOGIN_ACTION = 'Start Your Gotchi AI Session';

export const useAuth = () => {
  const { walletStore } = useStores();
  const { signTypedDataAsync } = useSignTypedData();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginPromiseRef = useRef<Promise<boolean> | null>(null);
  // Stabilize signTypedDataAsync via ref to prevent login from being recreated every render
  const signTypedDataRef = useRef(signTypedDataAsync);
  signTypedDataRef.current = signTypedDataAsync;
  // Track failed login attempts to prevent infinite signature popup loops
  const loginFailedRef = useRef(false);

  const isAuthenticated = !!walletStore.token && !!walletStore.userId;

  const login = useCallback(async (): Promise<boolean> => {
    // Already authenticated
    if (isAuthenticated) return true;

    // If a login is already in progress, wait for it
    if (loginPromiseRef.current) return loginPromiseRef.current;

    // Don't retry automatically after a failed/rejected attempt
    if (loginFailedRef.current) return false;

    if (!walletStore.isConnected || !walletStore.address) {
      return false;
    }

    // Check cached token first
    const existingToken = getToken();
    const cacheKey = `userId_${walletStore.address.toLowerCase()}`;
    const cachedUserId = localStorage.getItem(cacheKey);

    if (existingToken && cachedUserId) {
      walletStore.setToken(existingToken);
      walletStore.setUserId(cachedUserId);
      return true;
    }

    const doLogin = async (): Promise<boolean> => {
      setIsLoggingIn(true);
      try {
        const timestamp = Math.floor(Date.now() / 1000);

        const signature = await signTypedDataRef.current({
          domain: LOGIN_DOMAIN,
          types: LOGIN_TYPES,
          primaryType: 'SessionAuth',
          message: {
            action: LOGIN_ACTION,
            user: walletStore.address!,
            timestamp: BigInt(timestamp),
          },
        });

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: walletStore.address,
            signature,
            timestamp,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.code === 0 && result.data) {
            const { token, user_id } = result.data;
            setToken(token);
            walletStore.setToken(token);
            walletStore.setUserId(user_id);
            localStorage.setItem(cacheKey, user_id);
            loginFailedRef.current = false;
            return true;
          }
        }
        loginFailedRef.current = true;
        return false;
      } catch (error) {
        loginFailedRef.current = true;
        return false;
      } finally {
        setIsLoggingIn(false);
        loginPromiseRef.current = null;
      }
    };

    loginPromiseRef.current = doLogin();
    return loginPromiseRef.current;
  }, [isAuthenticated, walletStore]);

  const logout = useCallback(() => {
    removeToken();
    walletStore.setToken(undefined);
    walletStore.setUserId(undefined);
    loginFailedRef.current = false;
  }, [walletStore]);

  // Allow manual retry after a failed login (e.g., user clicks a "Sign In" button)
  const retryLogin = useCallback(() => {
    loginFailedRef.current = false;
  }, []);

  return { login, logout, retryLogin, isAuthenticated, isLoggingIn };
};
