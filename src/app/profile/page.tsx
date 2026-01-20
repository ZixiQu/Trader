'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isMarketOpen, isCrypto } from '@/utils/marketStatus';

export default function ProfilePage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const isPending = status === 'loading';
	const isError = status === 'unauthenticated';

	const [cash, setCash] = React.useState(0);
	const [stocks, setStocks] = React.useState<any[]>([]);
	const [bonds, setBonds] = React.useState<any[]>([]);
	const [depositInput, setDepositInput] = React.useState('');
	const [prices, setPrices] = React.useState<Record<string, number>>({});

	async function refreshPortfolio() {
		const res = await fetch('/api/portfolio');
		const data = await res.json();

		setCash(data.cash);
		setStocks(data.stocks);
		setBonds(data.bonds);

		// Fetch current prices
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
				}),
			).then((results) => {
				const priceMap: Record<string, number> = {};
				results.forEach((r) => {
					if (r.price) priceMap[r.symbol] = r.price;
				});
				setPrices(priceMap);
			});
		}
	}

	useEffect(() => {
		if (isError) router.push('/401');
	}, [isError, router]);

	useEffect(() => {
		if (!session?.user?.id) return;
		refreshPortfolio();

		const timer = setInterval(() => {
			// Similar logic to Holdings: if we have crypto, update 24/7
			const hasCrypto = stocks.some((s) => isCrypto(s.symbol));
			const shouldUpdate = hasCrypto ? true : isMarketOpen('STOCK', null);

			if (!document.hidden && shouldUpdate) {
				refreshPortfolio();
			}
		}, 5000);

		return () => clearInterval(timer);
	}, [session]);

	if (isPending) return <div>Loading...</div>;
	if (isError) return null;

	// Calculate Net Worth using LIVE prices if available, otherwise fallback to avgPrice
	const totalStockValue = stocks.reduce((sum, s) => {
		const price = prices[s.symbol] ?? s.avgPrice;
		return sum + s.shares * price;
	}, 0);

	const totalBondValue = bonds.reduce((sum, b) => {
		const price = prices[b.symbol] ?? b.avgPrice;
		return sum + b.quantity * price;
	}, 0);

	const totalNetWorth = cash + totalStockValue + totalBondValue;

	const handleDeposit = async () => {
		const amount = parseFloat(depositInput);
		if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

		const res = await fetch('/api/cash', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'DEPOSIT', amount }),
		});

		if (!res.ok) {
			const data = await res.json();
			alert(data.error);
			return;
		}

		setCash((prev) => prev + amount);
		toast.success('Deposit successful');
		setDepositInput('');
	};

	async function sellStock(symbol: string, shares: number) {
		// Get current price for the stock
		const priceRes = await fetch(`/api/prices?symbol=${symbol}`);
		const priceData = await priceRes.json();
		const currentPrice = priceData.price || 0;

		const res = await fetch('/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'SELL',
				assetType: 'STOCK',
				symbol,
				quantity: shares,
				price: currentPrice,
			}),
		});

		const json = await res.json();

		if (json.error) {
			toast.error(json.error);
			return;
		}

		toast.success(`Sold all shares of ${symbol}`);

		refreshPortfolio();
	}

	async function sellBond(symbol: string, quantity: number) {
		// Get current price for the bond
		const priceRes = await fetch(`/api/prices?symbol=${symbol}`);
		const priceData = await priceRes.json();
		const currentPrice = priceData.price || 0;

		const res = await fetch('/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'SELL',
				assetType: 'BOND',
				symbol,
				quantity,
				price: currentPrice,
			}),
		});

		const json = await res.json();

		if (json.error) {
			toast.error(json.error);
			return;
		}

		toast.success(`Sold all units of ${symbol}`);

		refreshPortfolio();
	}

	return (
		<div className="p-3 space-y-8 max-w-5xl mx-auto w-full">
			<h1 className="text-3xl font-bold">Your Assets</h1>

			<div className="flex flex-col sm:flex-row gap-4 w-full">
				<Card className="flex-1">
					<CardHeader>
						<CardTitle>Cash Balance</CardTitle>
						<CardDescription>Total available cash (CAD)</CardDescription>
					</CardHeader>

					<CardContent>
						<div className="flex justify-between items-center w-full">
							<p className="text-2xl font-semibold">${cash.toFixed(2)}</p>

							<div className="flex gap-2 items-center">
								<Input
									type="number"
									placeholder="Deposit"
									value={depositInput}
									onChange={(e) => setDepositInput(e.target.value)}
									className="w-40"
								/>
								<Button onClick={handleDeposit}>Confirm</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="flex-1">
					<CardHeader>
						<CardTitle>Total Net Worth</CardTitle>
						<CardDescription>Cash + Stocks + Bonds</CardDescription>
					</CardHeader>

					<CardContent>
						<p className="text-4xl font-bold text-primary">
							${totalNetWorth.toFixed(2)}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* STOCK HOLDINGS */}
			<Card>
				<CardHeader>
					<CardTitle>Stock Holdings</CardTitle>
				</CardHeader>

				<CardContent>
					<ScrollArea className="h-[220px] w-full rounded-md border">
						<div className="p-4 space-y-3 min-w-[380px]">
							{stocks.map((s) => {
								const avgPrice = Number(s.avgPrice);
								const currentPrice = prices[s.symbol];
								let profit = 0;
								let profitPercent = 0;

								if (currentPrice) {
									profit = (currentPrice - avgPrice) * s.shares;
									profitPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
								}
								
								return (
								<React.Fragment key={s.symbol}>
									<div className="flex items-center justify-between text-sm">
										<div className="flex flex-col">
											<span className="font-semibold">{s.symbol}</span>
											<span className="text-muted-foreground text-xs">
												{s.shares} shares @ ${avgPrice.toFixed(2)}
											</span>
										</div>

										<div className="flex flex-col text-right mr-4">
											<span className="font-medium">
												${(s.shares * (currentPrice ?? avgPrice)).toFixed(2)}
											</span>
											{currentPrice && (
												<span className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
													{profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% (${Math.abs(profit).toFixed(2)})
												</span>
											)}
										</div>

										<Button
											variant="destructive"
											size="sm"
											className="w-24"
											onClick={() => sellStock(s.symbol, Number(s.shares))}
										>
											Sell All
										</Button>
									</div>
									<Separator />
								</React.Fragment>
							)})}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>

			{/* BOND HOLDINGS */}
			<Card>
				<CardHeader>
					<CardTitle>Bond Holdings</CardTitle>
				</CardHeader>

				<CardContent>
					<ScrollArea className="h-[220px] w-full rounded-md border">
						<div className="p-4 space-y-3 min-w-[380px]">
							{bonds.map((b) => {
								const avgPrice = Number(b.avgPrice);
								const currentPrice = prices[b.symbol];
								let profit = 0;
								let profitPercent = 0;

								if (currentPrice) {
									profit = (currentPrice - avgPrice) * b.quantity;
									profitPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
								}

								return (
								<React.Fragment key={b.symbol}>
									<div className="flex items-center justify-between text-sm">
										{/* LEFT: Symbol + units */}
										<div className="flex flex-col">
											<span className="font-semibold">{b.symbol}</span>
											<span className="text-muted-foreground text-xs">
												{b.quantity} units @ ${avgPrice.toFixed(2)}
											</span>
										</div>

										{/* MIDDLE: Value */}
										<div className="flex flex-col text-right mr-4">
											<span className="font-medium">
												${(b.quantity * (currentPrice ?? avgPrice)).toFixed(2)}
											</span>
											{currentPrice && (
												<span className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
													{profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% (${Math.abs(profit).toFixed(2)})
												</span>
											)}
										</div>

										{/* RIGHT: Sell button */}
										<Button
											variant="destructive"
											size="sm"
											className="w-24"
											onClick={() =>
												sellBond(
													b.symbol,
													Number(b.quantity),
												)
											}
										>
											Sell All
										</Button>
									</div>
									<Separator />
								</React.Fragment>
							)})}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}
