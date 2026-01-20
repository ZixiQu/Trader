'use client';

import * as React from 'react';
import { useState } from 'react';

import {
	STOCKS,
	BONDS,
	CRYPTO,
	STOCK_DETAILS,
	BOND_DETAILS,
	CRYPTO_DETAILS,
	StockSymbol,
	BondSymbol,
	CryptoSymbol,
} from '@/constants/assets';
import { isMarketOpen } from '@/utils/marketStatus';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';

export default function TradePage() {
	const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
	const [selectedCrypto, setSelectedCrypto] = useState<CryptoSymbol | null>(null);
	const [selectedBond, setSelectedBond] = useState<BondSymbol | null>(null);
	const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');

	const [unitInput, setUnitInput] = useState<string>('');
	const units = Number(unitInput) || 0;

	const [price, setPrice] = useState<number | null>(null);

	async function loadPrice(asset: string) {
		const res = await fetch(`/api/prices?symbol=${asset}`, { cache: 'no-store' });
		const json = await res.json();
		setPrice(json.price ?? null);
	}

	function resetSelection() {
		setUnitInput('');
		setPrice(null);
	}

	function selectStock(symbol: StockSymbol) {
		setSelectedStock(symbol);
		setSelectedCrypto(null);
		setSelectedBond(null);
		resetSelection();
		loadPrice(symbol);
	}

	function selectCrypto(symbol: CryptoSymbol) {
		setSelectedCrypto(symbol);
		setSelectedStock(null);
		setSelectedBond(null);
		resetSelection();
		loadPrice(symbol);
	}

	function selectBond(symbol: BondSymbol) {
		setSelectedBond(symbol);
		setSelectedStock(null);
		setSelectedCrypto(null);
		resetSelection();
		loadPrice(symbol);
	}

	// Refresh selected asset price every 5s (crypto 24/7, stocks/bonds only when market open)
	React.useEffect(() => {
		const symbol = selectedStock || selectedCrypto || selectedBond;
		if (!symbol) return;

		const timer = setInterval(() => {
			const type = selectedBond ? 'BOND' : 'STOCK'; // Crypto is treated as STOCK in DB
			const shouldUpdate = isMarketOpen(type, symbol);

			if (!document.hidden && shouldUpdate) {
				loadPrice(symbol);
			}
		}, 5000);

		return () => clearInterval(timer);
	}, [selectedStock, selectedCrypto, selectedBond]);

	async function onConfirm() {
		const asset = selectedStock ?? selectedCrypto ?? selectedBond;
		if (!asset || units <= 0) return;

		// Determine asset type: stocks and crypto are STOCK, bonds are BOND
		const assetType = selectedBond ? 'BOND' : 'STOCK';

		const payload = {
			action: mode,
			assetType,
			symbol: asset,
			quantity: units,
			price: price || 0,
		};

		if (mode === 'BUY' && !price) return;

		const res = await fetch('/api/transactions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const json = await res.json();

		if (json.error) {
			toast.error(json.error);
			return;
		}

		const verb = mode === 'BUY' ? 'purchased' : 'sold';

		toast.success('Trade completed!', {
			description: `${units} units of ${asset} ${verb} ${
				mode === 'BUY' && price ? `for $${(units * price).toFixed(2)}` : ''
			}`,
		});

		setSelectedStock(null);
		setSelectedCrypto(null);
		setSelectedBond(null);
		setUnitInput('');
		setPrice(null);
	}

	const selectedDetails = selectedStock
		? STOCK_DETAILS[selectedStock]
		: selectedCrypto
		? CRYPTO_DETAILS[selectedCrypto]
		: selectedBond
		? BOND_DETAILS[selectedBond]
		: null;

	const totalCost = price && units > 0 ? units * price : null;

	// Allow decimal input (one decimal point max)
	function handleUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
		let value = e.target.value.replace(/[^0-9.]/g, '');
		// Keep only the first dot
		value = value.replace(/(\..*)\./g, '$1');
		setUnitInput(value);
	}

	const disableConfirm = mode === 'BUY' ? !price || units <= 0 : units <= 0;

	return (
		<div className="flex p-6 gap-6">
			{/* Left: Stocks + Crypto */}
			<div className="w-1/2 flex flex-col gap-6">
				{/* STOCKS */}
				<Card>
					<CardHeader>
						<CardTitle>Stocks</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[200px] rounded-md border w-full">
							<div className="p-3 space-y-3 min-w-[420px]">
								{STOCKS.map((symbol) => {
									const d = STOCK_DETAILS[symbol];
									return (
										<React.Fragment key={symbol}>
											<div
												className="flex justify-between items-center text-sm hover:bg-muted/40 p-3 rounded cursor-pointer"
												onClick={() => selectStock(symbol)}
											>
												<div>
													<span className="font-semibold">{symbol}</span>
													<div className="text-xs text-muted-foreground">
														{d.name} • {d.sector} • {d.market}
													</div>
												</div>
												<span className="text-muted-foreground text-sm">Trade</span>
											</div>
											<Separator />
										</React.Fragment>
									);
								})}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				{/* CRYPTO */}
				<Card>
					<CardHeader>
						<CardTitle>Crypto</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[200px] rounded-md border w-full">
							<div className="p-3 space-y-3 min-w-[420px]">
								{CRYPTO.map((symbol) => {
									const d = CRYPTO_DETAILS[symbol];
									return (
										<React.Fragment key={symbol}>
											<div
												className="flex justify-between items-center text-sm hover:bg-muted/40 p-3 rounded cursor-pointer"
												onClick={() => selectCrypto(symbol)}
											>
												<div>
													<span className="font-semibold">{symbol}</span>
													<div className="text-xs text-muted-foreground">
														{d.name} • {d.sector} • {d.market}
													</div>
												</div>
												<span className="text-muted-foreground text-sm">Trade</span>
											</div>
											<Separator />
										</React.Fragment>
									);
								})}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Right: Bonds + Trade Details */}
			<div className="w-1/2 flex flex-col gap-6">
				{/* BONDS */}
				<Card>
					<CardHeader>
						<CardTitle>Bonds</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[200px] rounded-md border w-full">
							<div className="p-3 space-y-3 min-w-[420px]">
								{BONDS.map((symbol) => {
									const d = BOND_DETAILS[symbol];
									return (
										<React.Fragment key={symbol}>
											<div
												className="flex justify-between items-center text-sm hover:bg-muted/40 p-3 rounded cursor-pointer"
												onClick={() => selectBond(symbol)}
											>
												<div>
													<span className="font-semibold">{symbol}</span>
													<div className="text-xs text-muted-foreground">
														{d.name} • {d.category} • {d.term}
													</div>
												</div>
												<span className="text-muted-foreground text-sm">Trade</span>
											</div>
											<Separator />
										</React.Fragment>
									);
								})}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				{/* Trade details panel */}
				<Card>
					<CardHeader>
						<CardTitle>Trade Details</CardTitle>
					</CardHeader>
					<CardContent>
						{(selectedStock || selectedCrypto || selectedBond) && selectedDetails ? (
							<div className="space-y-4 text-center">
								<p className="font-medium text-lg">
									{selectedDetails.name} ({selectedStock || selectedCrypto || selectedBond})
								</p>

								{/* Buy/Sell toggle */}
								<div className="flex justify-center gap-3">
									<Button
										variant={mode === 'BUY' ? 'default' : 'outline'}
										size="sm"
										onClick={() => setMode('BUY')}
									>
										Buy
									</Button>
									<Button
										variant={mode === 'SELL' ? 'default' : 'outline'}
										size="sm"
										onClick={() => setMode('SELL')}
									>
										Sell
									</Button>
								</div>

								<div>
									<p className="text-sm mb-1">Units</p>
									<Input
										type="text"
										inputMode="decimal"
										value={unitInput}
										onChange={handleUnitChange}
										className="w-32 mx-auto"
									/>
								</div>

								<p className="text-sm">
									Current Price:{' '}
									{price ? <b>${price.toFixed(2)}</b> : 'Loading...'}
								</p>

								{mode === 'BUY' && totalCost !== null && (
									<p className="text-sm font-semibold">Total Cost: ${totalCost.toFixed(2)}</p>
								)}

								<Button
									onClick={onConfirm}
									disabled={disableConfirm}
									className="w-full"
								>
									{mode === 'BUY' ? 'Confirm Buy' : 'Confirm Sell'}
								</Button>
							</div>
						) : (
							<div className="h-full flex items-center justify-center text-muted-foreground">
								Select an asset to trade
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
