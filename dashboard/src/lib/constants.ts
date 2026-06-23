export const SUPPORTED_CHAINS = ['ethereum', 'arbitrum', 'bsc', 'base'] as const;
export type SupportedChain = typeof SUPPORTED_CHAINS[number];