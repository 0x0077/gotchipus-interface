import { ethers, keccak256, solidityPacked, getAddress, AbiCoder } from "ethers";
import { PUS_ADDRESS } from "@/src/app/blockchain";

const abi = new AbiCoder();

export function getERC6551AccountSalt(chainId: number | bigint, tokenId: number | bigint) {
  const encoded = abi.encode(
    ["uint256", "uint256", "address"],
    [BigInt(chainId), BigInt(tokenId), getAddress(PUS_ADDRESS)]
  );
  return keccak256(encoded);
}


export async function getNativeBalance(address: string) {
  const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC || "https://mainnet.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return balance;
}


// On-chain `globalSalt` set in InitDiamond at deploy time (see gotchipus-core
// script/Deploy.s.sol). MUST match the deployed value or the trait preview
// computed here will diverge from what `randomTraitsIndex` produces on summon.
const GLOBAL_SALT = BigInt(
  "46785146710873639958814449378185535879182551704685377603288035974162545639424"
);

export function getTraitsIndex(
  tokenId: number,
  account: string,
  sender: string,
  preIndex: number
) {
  let seed = keccak256(
    solidityPacked(
      ["uint256", "address", "address", "uint256", "uint256"],
      [tokenId, getAddress(account), getAddress(sender), GLOBAL_SALT, preIndex]
    )
  );

  const counts = [25, 37, 13];
  const indices: number[] = [];

  for (let i = 0; i < 3; i++) {

    seed = keccak256(solidityPacked(["bytes32", "uint256"], [seed, BigInt(i)]));
    const index = Number(BigInt(seed) % BigInt(counts[i]));
    indices.push(index);
  }

  return indices;
}