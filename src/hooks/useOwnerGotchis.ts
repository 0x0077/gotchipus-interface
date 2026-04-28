import { useState, useEffect } from 'react';
import { GotchiMetadata } from '@/lib/types';

interface UseOwnerGotchisResult {
  gotchis: GotchiMetadata[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useOwnerGotchis = (ownerAddress?: string): UseOwnerGotchisResult => {
  const [gotchis, setGotchis] = useState<GotchiMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGotchis = async () => {
    if (!ownerAddress) {
      setGotchis([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gotchi/owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: ownerAddress }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gotchis: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setGotchis(result.data || []);
    } catch (err: any) {
      setError(err);
      setGotchis([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGotchis();
  }, [ownerAddress]);

  return {
    gotchis,
    isLoading,
    error,
    refetch: fetchGotchis,
  };
};
