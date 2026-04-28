import gotchipusAbi from './abi/gotchipus-abi.json';
import erc6551RegistryAbi from './abi/erc6551-registry-abi.json';
import hooksAbi from './abi/hooks-abi.json';
import ownershipAbi from './abi/ownership-abi.json';
import simpleErc20Abi from './abi/simple-erc20-abi.json';
import attributesAbi from './abi/attributes-facet-abi.json';
import diamondCutAbi from './abi/diamond-cut-abi.json';
import diamondLoupeAbi from './abi/diamond-loupe-abi.json';
import diamondAbi from './abi/diamond-abi.json';
import erc6551FacetAbi from './abi/erc6551-facet-abi.json';
import svgFacetAbi from './abi/svg-facet-abi.json';
import wearableFacetAbi from './abi/wearable-facet-abi.json';
import metadataFacetAbi from './abi/metadata-facet-abi.json';
import mintFacetAbi from './abi/mint-facet-abi.json';
import paymasterFacetAbi from './abi/paymaster-facet-abi.json';
import gotchiWearableFacetAbi from './abi/gotchi-wearable-facet-abi.json';
import securityFacetAbi from './abi/security-facet-abi.json';
import chiRegistryAbi from './abi/chi-registry-abi.json';

export const PUS_ABI = [
  ...gotchipusAbi,
  ...hooksAbi,
  ...ownershipAbi,
  ...simpleErc20Abi,
  ...attributesAbi,
  ...diamondCutAbi,
  ...diamondLoupeAbi,
  ...diamondAbi,
  ...erc6551FacetAbi,
  ...svgFacetAbi,
  ...metadataFacetAbi,
  ...mintFacetAbi,
  ...paymasterFacetAbi,
  ...gotchiWearableFacetAbi,
  ...securityFacetAbi,
];

export const PUS_ADDRESS = '0x5A3AFa97584Fa8cdEc4be2a6aB86Ceed05600C5e'; 
export const ERC6551_REGISTRY_ADDRESS = '0x000000E7C8746fdB64D791f6bb387889c5291454';
export const ERC6551_ACCOUNT_IMPLEMENTATION_ADDRESS = '0xb98aA33B8a0C6Ca0fb5667DC2601032Bff92D7B3';
export const WEARABLE_MARKETPLACE_ADDRESS = '0x8dB7b79bA547F993B82cA13cF6A7046bF48cA522';
export const WEARABLE_MARKETPLACE_ABI = wearableFacetAbi;
export const ERC6551_ABI = erc6551RegistryAbi;
export const ERC20_ABI = simpleErc20Abi;
export const CHI_REGISTRY_ABI = chiRegistryAbi;
export const CHI_DIAMOND_ADDRESS = '0x2b441dbb56D0Ee547718d4966781750E8e9Df4f1';