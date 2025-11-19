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

const initialCashBalance = 1520.75;

const stockHoldings = [
    { symbol: 'AMZN', shares: 3, value: 435.33 },
    { symbol: 'AAPL', shares: 5, value: 812.5 },
    { symbol: 'NVDA', shares: 2, value: 247.0 }
];

const bondHoldings = [
    { name: 'US Treasury 2yr', amount: 300, value: 312.0 },
    { name: 'Canada Gov Bond', amount: 200, value: 203.5 }
];

const sum = (arr: { value: number }[]) => arr.reduce((a, b) => a + b.value, 0);

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const isPending = status === 'loading';
    const isError = status === 'unauthenticated';

    useEffect(() => {
        if (isError) {
            router.replace('/401');
        }
    }, [isError, router]);

    const [cash, setCash] = React.useState(initialCashBalance);

    const [depositInput, setDepositInput] = React.useState('');

    if (isPending) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return null;
    }

    const totalStockValue = sum(stockHoldings);
    const totalBondValue = sum(bondHoldings);
    const totalNetWorth = cash + totalStockValue + totalBondValue;

    const handleDeposit = async () => {
        console.log(session?.user);
        if (!session?.user?.id) {
            alert('You must be signed in to deposit.');
            return;
        }

        const amount = parseFloat(depositInput);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid deposit amount.');
            return;
        }

        try {
            const res = await fetch('/api/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    amount
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Deposit failed.');
                return;
            }

            setCash(prev => prev + amount);
            toast.success('Deposit successful!', {
                description: `+$${amount.toFixed(2)} CAD added to your balance.`
            });
            setDepositInput('');
        } catch (error) {
            console.error(error);
            alert('Something went wrong while depositing.');
        }
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
                                <Input type="number" placeholder="Deposit" value={depositInput} onChange={e => setDepositInput(e.target.value)} className="w-40" />
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
                        <p className="text-4xl font-bold text-primary">${totalNetWorth.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Holdings</CardTitle>
                    <CardDescription>Your owned stocks</CardDescription>
                </CardHeader>

                <CardContent>
                    <ScrollArea className="h-[220px] w-full rounded-md border">
                        <div className="p-4 space-y-3 min-w-[380px]">
                            {stockHoldings.map(s => (
                                <React.Fragment key={s.symbol}>
                                    <div className="grid grid-cols-3 text-sm items-center">
                                        <div className="font-semibold">{s.symbol}</div>
                                        <div className="text-muted-foreground">{s.shares} shares</div>
                                        <div className="text-right font-medium">${s.value.toFixed(2)}</div>
                                    </div>
                                    <Separator />
                                </React.Fragment>
                            ))}
                            <div className="grid grid-cols-3 text-sm font-semibold">
                                <div></div>
                                <div>Total:</div>
                                <div className="text-right">${totalStockValue.toFixed(2)}</div>
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* BOND HOLDINGS */}
            <Card>
                <CardHeader>
                    <CardTitle>Bond Holdings</CardTitle>
                    <CardDescription>Your owned bonds</CardDescription>
                </CardHeader>

                <CardContent>
                    <ScrollArea className="h-[220px] w-full rounded-md border">
                        <div className="p-4 space-y-3 min-w-[380px]">
                            {bondHoldings.map(b => (
                                <React.Fragment key={b.name}>
                                    <div className="grid grid-cols-3 text-sm items-center">
                                        <div className="font-semibold">{b.name}</div>
                                        <div className="text-muted-foreground">${b.amount} invested</div>
                                        <div className="text-right font-medium">${b.value.toFixed(2)}</div>
                                    </div>
                                    <Separator />
                                </React.Fragment>
                            ))}
                            <div className="grid grid-cols-3 text-sm font-semibold">
                                <div></div>
                                <div>Total:</div>
                                <div className="text-right">${totalBondValue.toFixed(2)}</div>
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
