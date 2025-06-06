import { ethers } from "ethers";
import { PUS_ADDRESS } from "@/src/app/blockchain";

export function getERC6551AccountSalt(chainId: number, tokenId: number) {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodeData = abiCoder.encode(
    ["uint256", "uint256", "address"],
    [chainId, tokenId, PUS_ADDRESS]
  );
  return ethers.keccak256(encodeData);
}


export async function getPharosNativeBalance(address: string) {
  const provider = new ethers.JsonRpcProvider("https://testnet.dplabs-internal.com");
  const balance = await provider.getBalance(address);
  return balance;
}