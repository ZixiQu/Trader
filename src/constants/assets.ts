export const STOCKS = ['AMZN', 'AAPL', 'NVDA'] as const;
export type StockSymbol = (typeof STOCKS)[number];

export const BONDS = ['US_BOND', 'CA_BOND'] as const;
export type BondSymbol = (typeof BONDS)[number];
