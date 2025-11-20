'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';

export function Holdings() {
	const { data: session } = useSession();
	const [stocks, setStocks] = useState<any[]>([]);

	useEffect(() => {
		if (!session?.user?.id) return;

		fetch('/api/portfolio')
			.then((res) => res.json())
			.then((data) => {
				setStocks(data.stocks || []);
			});
	}, [session]);

	return (
		<ScrollArea className="h-95 w-100 rounded-md border">
			<div className="p-4 space-y-3">
				<h4 className="text-sm font-medium mb-4">Your Holdings</h4>

				{stocks.map((s) => {
					const totalCost = s.shares * Number(s.avgPrice);
					const currentValue = s.shares * Number(s.currentPrice ?? s.avgPrice);
					const profit = currentValue - totalCost;

					return (
						<div key={s.symbol}>
							<div className="flex justify-between text-md">
								<div className="font-semibold">{s.symbol}</div>
								<div className="text-muted-foreground">{s.shares} shares</div>
								<span
									className={
										profit >= 0
											? 'text-green-500 font-medium'
											: 'text-red-500 font-medium'
									}
								>
									{profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
								</span>
							</div>
							<Separator />
						</div>
					);
				})}
			</div>
		</ScrollArea>
	);
}
