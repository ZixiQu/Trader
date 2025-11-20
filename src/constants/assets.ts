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

export const BONDS = ['US_BOND', 'CA_BOND'] as const;
export type BondSymbol = (typeof BONDS)[number];

export const BOND_DETAILS: Record<
	BondSymbol,
	{
		name: string;
		category: string;
		term: string;
	}
> = {
	US_BOND: { name: 'US Treasury Bond', category: 'Government Bond', term: '10yr' },
	CA_BOND: { name: 'Canada Savings Bond', category: 'Government Bond', term: '5yr' },
};
