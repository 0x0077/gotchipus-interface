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

export const PUS_ADDRESS = '0x000000007B5758541e9d94a487B83e11Cd052437';
export const ERC6551_REGISTRY_ADDRESS = '0x000000E7C8746fdB64D791f6bb387889c5291454';
export const ERC6551_ACCOUNT_IMPLEMENTATION_ADDRESS = '0xb98aA33B8a0C6Ca0fb5667DC2601032Bff92D7B3';
export const WEARABLE_MARKETPLACE_ADDRESS = '0xEcA0266B4c5a0fB0B4D87049DdE458c8AA08b166';
export const WEARABLE_MARKETPLACE_ABI = wearableFacetAbi;
export const ERC6551_ABI = erc6551RegistryAbi;
export const ERC20_ABI = simpleErc20Abi;
export const CHI_REGISTRY_ABI = chiRegistryAbi;
export const CHI_DIAMOND_ADDRESS = '0x0F5e523eBB5861F7d2Acf4e4744B08358022720B';