import { makeAutoObservable, runInAction } from "mobx";
import { type Address } from "viem";
import { ethers } from "ethers";

class WalletStore {
  address: Address | undefined = undefined;
  isConnected: boolean = false;
  isConnecting: boolean = false;
  balance: string | undefined = undefined;
  symbol: string | undefined = undefined;
  chainId: number | undefined = undefined;
  isWalletConnected: boolean = false;
  isTaskRefreshing: boolean = false;
  userId: string | undefined = undefined;
  token: string | undefined = undefined;

  tokenBoundAccounts: Record<string, string> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setWalletState(state: {
    address?: Address;
    isConnected?: boolean;
    isConnecting?: boolean;
    balance?: string;
    symbol?: string;
    chainId?: number;
  }) {
    runInAction(() => {
      Object.assign(this, state);
    });
  }

  setWalletConnected(isConnected: boolean) {
    runInAction(() => {
      this.isWalletConnected = isConnected;
    });
  }

  setIsTaskRefreshing(isRefreshing: boolean) {
    runInAction(() => {
      this.isTaskRefreshing = isRefreshing;
    });
  }

  setUserId(userId: string | undefined) {
    runInAction(() => {
      this.userId = userId;
    });
  }

  setToken(token: string | undefined) {
    runInAction(() => {
      this.token = token;
    });
  }

  setAuth(token: string, userId: string) {
    runInAction(() => {
      this.token = token;
      this.userId = userId;
    });
  }

  setTokenBoundAccount(tokenId: string, address: string) {
    runInAction(() => {
      this.tokenBoundAccounts[tokenId] = address;
    });
  }

  getTokenBoundAccount(tokenId: string): string | undefined {
    return this.tokenBoundAccounts[tokenId];
  }

  resetTokenBoundAccounts() {
    runInAction(() => {
      this.tokenBoundAccounts = {};
    });
  }

  reset() {
    runInAction(() => {
      this.address = undefined;
      this.isConnected = false;
      this.isConnecting = false;
      this.balance = undefined;
      this.symbol = undefined;
      this.chainId = undefined;
      this.userId = undefined;
      this.token = undefined;
      this.resetTokenBoundAccounts();
    });
  }

  get shortAddress() {
    if (!this.address) return '';
    return `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
  }

  get chainName() {
    return this.chainId === 1672 ? 'Pharos Mainnet' : 'Unknown Network';
  }

  formattedPharos(point: number = 4) {
    if (!this.balance) return '';
    const formattedBalance = ethers.formatEther(this.balance);
    return parseFloat(formattedBalance).toFixed(point);
  }

  get formattedBalance() {
    if (!this.balance || !this.symbol) return '';
    const formattedBalance = ethers.formatUnits(this.balance, 18);
    return `${formattedBalance} ${this.symbol}`;
  }

}

export default WalletStore;
