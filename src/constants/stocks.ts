export const STOCKS = ['AAPL', 'AMZN', 'NVDA'] as const;
export type StockSymbol = (typeof STOCKS)[number];
