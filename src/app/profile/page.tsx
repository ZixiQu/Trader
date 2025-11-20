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

export default function ProfilePage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const isPending = status === 'loading';
	const isError = status === 'unauthenticated';

	const [cash, setCash] = React.useState(0);
	const [stocks, setStocks] = React.useState<any[]>([]);
	const [bonds, setBonds] = React.useState<any[]>([]);
	const [depositInput, setDepositInput] = React.useState('');

	useEffect(() => {
		if (isError) router.replace('/401');
	}, [isError, router]);

	useEffect(() => {
		if (!session?.user?.id) return;

		fetch('/api/portfolio')
			.then((res) => res.json())
			.then((data) => {
				setCash(data.cash);
				setStocks(data.stocks);
				setBonds(data.bonds);
			})
			.catch(() => toast.error('Failed to load portfolio'));
	}, [session]);

	if (isPending) return <div>Loading...</div>;
	if (isError) return null;

	const totalStockValue = stocks.reduce((sum, s) => sum + s.shares * s.avgPrice, 0);
	const totalBondValue = bonds.reduce((sum, b) => sum + b.quantity * b.avgPrice, 0);
	const totalNetWorth = cash + totalStockValue + totalBondValue;

	const handleDeposit = async () => {
		const amount = parseFloat(depositInput);
		if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

		const res = await fetch('/api/cash/deposit', {
			method: 'POST',
			body: JSON.stringify({ amount }),
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
							{stocks.map((s) => (
								<React.Fragment key={s.symbol}>
									<div className="grid grid-cols-3 text-sm items-center">
										<div className="font-semibold">{s.symbol}</div>
										<div className="text-muted-foreground">
											{s.shares} shares
										</div>
										<div className="text-right font-medium">
											${(s.shares * s.avgPrice).toFixed(2)}
										</div>
									</div>
									<Separator />
								</React.Fragment>
							))}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>

			{/* BONDS */}
			<Card>
				<CardHeader>
					<CardTitle>Bond Holdings</CardTitle>
				</CardHeader>

				<CardContent>
					<ScrollArea className="h-[220px] w-full rounded-md border">
						<div className="p-4 space-y-3 min-w-[380px]">
							{bonds.map((b) => (
								<React.Fragment key={b.symbol}>
									<div className="grid grid-cols-3 text-sm items-center">
										<div className="font-semibold">{b.symbol}</div>
										<div className="text-muted-foreground">
											{b.quantity} units
										</div>
										<div className="text-right font-medium">
											${(b.quantity * b.avgPrice).toFixed(2)}
										</div>
									</div>
									<Separator />
								</React.Fragment>
							))}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}
