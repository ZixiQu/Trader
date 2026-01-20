'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import { isMarketOpen, isCrypto } from '@/utils/marketStatus';

export function Holdings() {
	const { data: session } = useSession();
	const [stocks, setStocks] = useState<any[]>([]);
	const [bonds, setBonds] = useState<any[]>([]);
	const [prices, setPrices] = useState<Record<string, number>>({});

	const refresh = () => {
		fetch('/api/portfolio')
			.then((res) => res.json())
			.then((data) => {
				setStocks(data.stocks || []);
				setBonds(data.bonds || []);

				// Fetch current prices for all assets
				const allSymbols = [
					...(data.stocks?.map((s: any) => s.symbol) || []),
					...(data.bonds?.map((b: any) => b.symbol) || []),
				];

				if (allSymbols.length > 0) {
					Promise.all(
						allSymbols.map(async (symbol) => {
							try {
								const res = await fetch(`/api/prices?symbol=${symbol}`);
								const json = await res.json();
								return { symbol, price: json.price };
							} catch {
								return { symbol, price: null };
							}
						})
					).then((results) => {
						const priceMap: Record<string, number> = {};
						results.forEach((r) => {
							if (r.price) priceMap[r.symbol] = r.price;
						});
						setPrices(priceMap);
					});
				}
			});
	}

	useEffect(() => {
		if (!session?.user?.id) return;

		refresh();

		const timer = setInterval(() => {
			// Check if we should update based on holdings
			// If we hold any crypto, we update 24/7.
			// If we only hold stocks/bonds, we check market hours.
			// For simplicity, we just check "STOCK" market hours unless we detect a crypto holding.
			
			const hasCrypto = stocks.some(s => isCrypto(s.symbol));
			const shouldUpdate = hasCrypto ? true : isMarketOpen('STOCK', null);

			if (!document.hidden && shouldUpdate) {
				refresh();
			}
		}, 5000);

		return () => clearInterval(timer);
	}, [session]);

	return (
		<ScrollArea className="h-95 w-100 rounded-md border">
			<div className="p-4 space-y-3">
				<h4 className="text-sm font-medium mb-4">Your Holdings</h4>

				{stocks.map((s) => {
					const avgPrice = Number(s.avgPrice);
					const currentPrice = prices[s.symbol];
					const totalCost = s.shares * avgPrice;
					let profit = 0;
					let profitPercent = 0;

					if (currentPrice) {
						profit = (currentPrice - avgPrice) * s.shares;
						profitPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
					}

					return (
						<div key={s.symbol}>
							<div className="flex justify-between text-md items-center">
								<div>
									<div className="font-semibold">{s.symbol}</div>
									<div className="text-muted-foreground text-xs">{s.shares} shares</div>
								</div>
								
								<div className="text-right flex flex-col items-end gap-1">
									<div className="text-sm font-medium">
										${totalCost.toFixed(2)}
									</div>
									{currentPrice ? (
										<div className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											{profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% (${Math.abs(profit).toFixed(2)})
										</div>
									) : (
										<div className="text-xs text-muted-foreground">Loading...</div>
									)}
								</div>
							</div>
							<Separator className="mt-2" />
						</div>
					);
				})}

				{bonds.length > 0 && stocks.length > 0 && <Separator className="my-2" />}

				{bonds.map((b) => {
					const avgPrice = Number(b.avgPrice);
					const currentPrice = prices[b.symbol];
					const totalCost = b.quantity * avgPrice;
					let profit = 0;
					let profitPercent = 0;

					if (currentPrice) {
						profit = (currentPrice - avgPrice) * b.quantity;
						profitPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
					}

					return (
						<div key={b.symbol}>
							<div className="flex justify-between text-md items-center">
								<div>
									<div className="font-semibold">{b.symbol}</div>
									<div className="text-muted-foreground text-xs">{b.quantity} units</div>
								</div>

								<div className="text-right flex flex-col items-end gap-1">
									<div className="text-sm font-medium">
										${totalCost.toFixed(2)}
									</div>
									{currentPrice ? (
										<div className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											{profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% (${Math.abs(profit).toFixed(2)})
										</div>
									) : (
										<div className="text-xs text-muted-foreground">Loading...</div>
									)}
								</div>
							</div>
							<Separator className="mt-2" />
						</div>
					);
				})}
			</div>
		</ScrollArea>
	);
}
