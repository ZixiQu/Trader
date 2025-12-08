export const STOCKS = ['AMZN', 'AAPL', 'NVDA'] as const;
export type StockSymbol = (typeof STOCKS)[number];

export const STOCK_DETAILS: Record<
	StockSymbol,
	{
		name: string;
		sector: string;
		market: string;
	}
> = {
	AMZN: { name: 'Amazon', sector: 'E-Commerce / Cloud', market: 'NASDAQ' },
	AAPL: { name: 'Apple', sector: 'Technology', market: 'NASDAQ' },
	NVDA: { name: 'Nvidia', sector: 'Semiconductors', market: 'NASDAQ' },
};

export const CRYPTO = ['BTC-USD', 'ETH-USD', 'DOGE-USD'] as const;
export type CryptoSymbol = (typeof CRYPTO)[number];

export const CRYPTO_DETAILS: Record<
	CryptoSymbol,
	{
		name: string;
		sector: string;
		market: string;
	}
> = {
	'BTC-USD': { name: 'Bitcoin', sector: 'Cryptocurrency', market: 'Crypto' },
	'ETH-USD': { name: 'Ethereum', sector: 'Cryptocurrency', market: 'Crypto' },
	'DOGE-USD': { name: 'Dogecoin', sector: 'Cryptocurrency', market: 'Crypto' },
};

export const BONDS = ['TLT', 'XGB.TO'] as const;
export type BondSymbol = (typeof BONDS)[number];

export const BOND_DETAILS: Record<
	BondSymbol,
	{
		name: string;
		category: string;
		term: string;
	}
> = {
	TLT: { name: 'iShares 20+ Year Treasury Bond ETF', category: 'US Government Bond', term: '20yr+' },
	'XGB.TO': { name: 'iShares Core Canadian Government Bond Index ETF', category: 'CA Government Bond', term: '1-10yr' },
};
