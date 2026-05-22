import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { PUS_ABI, PUS_ADDRESS } from '@/src/app/blockchain';
import { chain } from '@/src/app/blockchain/config';
import { GotchipusInfo } from '@/lib/types';

export const runtime = 'edge';

function stringifyBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'bigint') {
          newObj[key] = value.toString();
        } else {
          newObj[key] = stringifyBigInts(value);
        }
      }
    }
    return newObj;
  }
  return obj;
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

function flattenGotchipusInfo(info: any): GotchipusInfo {
  const s = stringifyBigInts(info);
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

const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://mainnet.base.org';
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');
    const tokenId = searchParams.get('tokenId');

    if (!ownerAddress || !isAddress(ownerAddress)) return NextResponse.json({ error: 'Valid owner address is required' }, { status: 400 });
    if (!tokenId) return NextResponse.json({ error: 'tokenId is required' }, { status: 400 });

    const selectedTokenId = BigInt(tokenId);

    const [info, tokenBoundAccount, tokenName] = await Promise.all([
      publicClient.readContract({ address: PUS_ADDRESS, abi: PUS_ABI, functionName: 'ownedTokenInfo', args: [ownerAddress, selectedTokenId] }).catch(() => null),
      publicClient.readContract({ address: PUS_ADDRESS, abi: PUS_ABI, functionName: 'account', args: [selectedTokenId] }).catch(() => null),
      publicClient.readContract({ address: PUS_ADDRESS, abi: PUS_ABI, functionName: 'getTokenName', args: [selectedTokenId] }).catch(() => null),
    ]);

    if (!info) {
        return NextResponse.json({ error: 'Token info not found' }, { status: 404 });
    }
    
    const flattenedInfo = flattenGotchipusInfo(info);

    const responseData = {
      info: flattenedInfo,
      tokenBoundAccount,
      tokenName
    };

    return NextResponse.json(responseData);

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}