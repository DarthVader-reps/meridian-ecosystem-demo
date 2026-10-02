/**
 * Crypto-only deposit/withdraw rails (BTC, ETH, USDT).
 * Everything remains simulated — these constants shape the product UX,
 * not real chain interactions.
 */

export const DEPOSIT_ASSETS = ['BTC', 'ETH', 'USDT'] as const
export type DepositAsset = (typeof DEPOSIT_ASSETS)[number]

/** Networks offered per asset on the deposit/withdraw route. */
export const CRYPTO_NETWORKS: Record<DepositAsset, string[]> = {
  BTC: ['Bitcoin network (simulated)'],
  ETH: ['Ethereum network (simulated)'],
  USDT: ['Ethereum · ERC-20 (simulated)', 'Tron · TRC-20 (simulated)'],
}

/**
 * Sample deposit addresses shown in the UI. Well-known example/burn
 * addresses where they exist; obviously synthetic otherwise. Always
 * presented with a "do not send real funds" label.
 */
export const SAMPLE_DEPOSIT_ADDRESS: Record<string, string> = {
  'Bitcoin network (simulated)': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'Ethereum network (simulated)': '0x000000000000000000000000000000000000dEaD',
  'Ethereum · ERC-20 (simulated)': '0x000000000000000000000000000000000000dEaD',
  'Tron · TRC-20 (simulated)': 'T111111111111111111111111111111111',
}

/** Shorten an address for review screens: first 10 + … + last 6. */
export function shortAddress(addr: string): string {
  const a = addr.trim()
  if (a.length <= 18) return a
  return `${a.slice(0, 10)}…${a.slice(-6)}`
}
