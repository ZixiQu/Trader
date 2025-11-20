'use client';

import * as React from 'react';
import { useState } from 'react';

import {
	STOCKS,
	BONDS,
	STOCK_DETAILS,
	BOND_DETAILS,
	StockSymbol,
	BondSymbol,
} from '@/constants/assets';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';

export default function TradePage() {
	const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
	const [selectedBond, setSelectedBond] = useState<BondSymbol | null>(null);

	const [unitInput, setUnitInput] = useState<string>('');
	const units = Number(unitInput) || 0;

	const [price, setPrice] = useState<number | null>(null);

	async function loadPrice(asset: string) {
		const res = await fetch(`/api/price?asset=${asset}`, { cache: 'no-store' });
		const json = await res.json();
		setPrice(json.price ?? null);
	}

	function selectStock(symbol: StockSymbol) {
		setSelectedStock(symbol);
		setSelectedBond(null);
		setUnitInput('');
		loadPrice(symbol);
	}

	function selectBond(symbol: BondSymbol) {
		setSelectedBond(symbol);
		setSelectedStock(null);
		setUnitInput('');
		setPrice(100);
	}

	async function onConfirm() {
		const asset = selectedStock ?? selectedBond;
		const res = await fetch('/api/trade', {
			method: 'POST',
			body: JSON.stringify({
				symbol: asset,
				quantity: units,
				price,
				assetType: selectedStock ? 'STOCK' : 'BOND',
			}),
		});

		const json = await res.json();

		if (json.error) {
			toast.error(json.error);
			return;
		}

		toast.success('Trade completed!', {
			description: `${units} units of ${asset} purchased for $${(
				units * (price || 0)
			).toFixed(2)}`,
		});

		setSelectedStock(null);
		setSelectedBond(null);
		setUnitInput('');
		setPrice(null);
	}

	const selected = selectedStock ?? selectedBond;
	const selectedDetails = selectedStock
		? STOCK_DETAILS[selectedStock]
		: selectedBond
		? BOND_DETAILS[selectedBond]
		: null;

	const totalCost = price && units > 0 ? units * price : null;

	return (
		<div className="flex p-6 gap-6">
			{/* STOCKS */}
			<div className="w-1/2">
				<Card>
					<CardHeader>
						<CardTitle>Stocks</CardTitle>
					</CardHeader>

					<CardContent>
						<ScrollArea className="h-[240px] rounded-md border w-full">
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

												<span className="text-muted-foreground text-sm">
													Trade
												</span>
											</div>
											<Separator />
										</React.Fragment>
									);
								})}
							</div>
						</ScrollArea>

						{selectedStock && selectedDetails && (
							<div className="mt-4 space-y-3 text-center">
								<p className="font-medium text-lg">
									{selectedDetails.name} ({selectedStock})
								</p>

								<div>
									<p className="text-sm mb-1">Units</p>
									<Input
										type="text"
										inputMode="numeric"
										value={unitInput}
										onChange={(e) =>
											setUnitInput(e.target.value.replace(/\D/g, ''))
										}
										className="w-32 mx-auto"
									/>
								</div>

								<p className="text-sm">
									Current Price:{' '}
									{price ? <b>${price.toFixed(2)}</b> : 'Loading...'}
								</p>

								{totalCost !== null && (
									<p className="text-sm font-semibold">
										Total Cost: ${totalCost.toFixed(2)}
									</p>
								)}

								<Button
									onClick={onConfirm}
									disabled={!price || units <= 0}
									className="w-full"
								>
									Confirm Trade
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* BONDS */}
			<div className="w-1/2">
				<Card>
					<CardHeader>
						<CardTitle>Bonds</CardTitle>
					</CardHeader>

					<CardContent>
						<ScrollArea className="h-[240px] rounded-md border w-full">
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

												<span className="text-muted-foreground text-sm">
													Trade
												</span>
											</div>
											<Separator />
										</React.Fragment>
									);
								})}
							</div>
						</ScrollArea>

						{selectedBond && selectedDetails && (
							<div className="mt-4 space-y-3 text-center">
								<p className="font-medium text-lg">
									{selectedDetails.name} ({selectedBond})
								</p>

								<div>
									<p className="text-sm mb-1">Units</p>
									<Input
										type="text"
										inputMode="numeric"
										value={unitInput}
										onChange={(e) =>
											setUnitInput(e.target.value.replace(/\D/g, ''))
										}
										className="w-32 mx-auto"
									/>
								</div>

								<p className="text-sm">
									Current Price: <b>$100.00</b>
								</p>

								{totalCost !== null && (
									<p className="text-sm font-semibold">
										Total Cost: ${totalCost.toFixed(2)}
									</p>
								)}

								<Button
									onClick={onConfirm}
									disabled={units <= 0}
									className="w-full"
								>
									Confirm Trade
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
