import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { PUS_ABI, PUS_ADDRESS } from '@/src/app/blockchain';
import { GotchipusInfo } from '@/lib/types';
import { chain } from '@/src/app/blockchain/config';

interface GotchipusResponse {
  balance: string;
  ids: string[];
  gotchipusInfo: GotchipusInfo[];
  totalCount: number;
  tbaAddresses: string[];
}

export const runtime = 'edge';

const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://mainnet.base.org';
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

async function getGotchipusTokens(ownerAddress: string, includeGotchipusInfo: boolean): Promise<GotchipusResponse> {
  try {
    const tokenIds = await publicClient.readContract({
      address: PUS_ADDRESS,
      abi: PUS_ABI,
      functionName: 'getGotchiOrBeaconInfo',
      args: [ownerAddress, 1]
    }) as bigint[];

    if (!tokenIds || tokenIds.length === 0) {
      return {
        balance: '0',
        ids: [],
        gotchipusInfo: [],
        totalCount: 0,
        tbaAddresses: [],
      };
    }

    const balance = tokenIds.length.toString();
    const ids = tokenIds.map(id => id.toString());

    const [gotchipusInfoResults, tbaResults] = await Promise.all([
      includeGotchipusInfo
        ? Promise.all(
            tokenIds.map(async (tokenId) => {
              try {
                const info = await publicClient.readContract({
                  address: PUS_ADDRESS,
                  abi: PUS_ABI,
                  functionName: 'ownedTokenInfo',
                  args: [ownerAddress, tokenId],
                }) as any;
                return serializeGotchipusInfo(info);
              } catch {
                return null;
              }
            })
          )
        : Promise.resolve([]),
      Promise.all(
        tokenIds.map(tokenId =>
          publicClient
            .readContract({ address: PUS_ADDRESS, abi: PUS_ABI, functionName: 'account', args: [tokenId] })
            .catch(() => null)
        )
      ),
    ]);

    const gotchipusInfo = (gotchipusInfoResults as (GotchipusInfo | null)[]).filter(Boolean) as GotchipusInfo[];
    const tbaAddresses = tbaResults.map(addr => (addr as string) || '');

    return {
      balance,
      ids,
      gotchipusInfo,
      totalCount: ids.length,
      tbaAddresses,
    };
  } catch (error: any) {
    if (error.message?.includes('execution reverted')) {
      return {
        balance: '0',
        ids: [],
        gotchipusInfo: [],
        totalCount: 0,
        tbaAddresses: [],
      };
    }
    throw error;
  }
}

function serializeBigIntFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigIntFields(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigIntFields(value);
    }
    return result;
  }
  
  return obj;
}

function serializeGotchipusInfo(info: any): GotchipusInfo {
  const s = serializeBigIntFields(info);
  const core = s.core || {};
  const soul = core.soul || {};

  return {
    name: s.name || "",
    uri: s.uri || "",
    collateral: s.collateral || "",
    collateralAmount: String(s.collateralAmount ?? '0'),
    status: Number(s.status ?? 0),
    locked: Boolean(s.locked),
    birthTime: Number(s.birthTime ?? 0),
    rarity: Number(s.rarity ?? 0),
    faction: Number(s.faction ?? 0),
    currentExp: Number(s.currentExp ?? 0),
    core: {
      strength: Number(core.strength ?? 0),
      defense: Number(core.defense ?? 0),
      mind: Number(core.mind ?? 0),
      vitality: Number(core.vitality ?? 0),
      agility: Number(core.agility ?? 0),
      luck: Number(core.luck ?? 0),
      soul: {
        balance: Number(soul.balance ?? 0),
        maxSoulCapacity: Number(soul.maxSoulCapacity ?? 0),
        lastSoulUpdate: Number(soul.lastSoulUpdate ?? 0),
        dormantSince: Number(soul.dormantSince ?? 0),
      },
    },
    singer: s.singer || "",
    nonces: String(s.nonces ?? '0'),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');
    const includeGotchipusInfo = searchParams.get('includeGotchipusInfo') !== 'false';

    if (!ownerAddress || !isAddress(ownerAddress)) {
      return NextResponse.json({ error: 'Valid owner address is required' }, { status: 400 });
    }

    const response = await getGotchipusTokens(ownerAddress, includeGotchipusInfo);
    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}