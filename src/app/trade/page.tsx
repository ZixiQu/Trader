'use client';

import * as React from 'react';
import { useState } from 'react';

import { STOCKS, BONDS } from '@/constants/assets';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';

export default function TradePage() {
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [selectedBond, setSelectedBond] = useState<string | null>(null);
    const [units, setUnits] = useState<number>(0);
    const [price, setPrice] = useState<number | null>(null);

    async function loadPrice(asset: string) {
        setPrice(null);
        const res = await fetch(`/api/price?asset=${asset}`, { cache: 'no-store' });
        const json = await res.json();
        setPrice(json.price ?? null);
    }

    async function onConfirm() {
        const asset = selectedStock ?? selectedBond;
        const type = selectedStock ? 'stock' : 'bond';

        const res = await fetch(`/api/trade`, {
            method: 'POST',
            body: JSON.stringify({
                asset,
                type,
                units,
                price
            })
        });

        const json = await res.json();

        if (json.error) {
            toast.error(json.error);
            return;
        }

        toast.success('Trade completed!', {
            description: `${units} units of ${asset} purchased at $${price?.toFixed(2)}`
        });

        // Reset fields
        setUnits(0);
        setPrice(null);
        setSelectedStock(null);
        setSelectedBond(null);
    }

    return (
        <div className="flex p-6 gap-6">
            {/* LEFT: STOCKS */}
            <div className="w-1/2">
                <Card>
                    <CardHeader>
                        <CardTitle>Stocks</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <ScrollArea className="h-[240px] rounded-md border w-full">
                            <div className="p-3 space-y-3 min-w-[380px]">
                                {STOCKS.map(sym => (
                                    <React.Fragment key={sym}>
                                        <div
                                            className="flex justify-between cursor-pointer text-sm hover:bg-muted/40 p-2 rounded"
                                            onClick={() => {
                                                setSelectedStock(sym);
                                                setSelectedBond(null);
                                                loadPrice(sym);
                                            }}
                                        >
                                            <span className="font-medium">{sym}</span>
                                            <span className="text-muted-foreground">Trade</span>
                                        </div>
                                        <Separator />
                                    </React.Fragment>
                                ))}
                            </div>
                        </ScrollArea>

                        {selectedStock && (
                            <div className="mt-4 space-y-3">
                                <p className="font-medium">Selected: {selectedStock}</p>

                                <div>
                                    <p className="text-sm mb-1">Units</p>
                                    <Input type="number" min={1} value={units} onChange={e => setUnits(Number(e.target.value))} />
                                </div>

                                <p className="text-sm">Current Price: {price ? <b>${price.toFixed(2)}</b> : 'Loading...'}</p>

                                <Button onClick={onConfirm} className="w-full">
                                    Confirm Trade
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: BONDS */}
            <div className="w-1/2">
                <Card>
                    <CardHeader>
                        <CardTitle>Bonds</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <ScrollArea className="h-[240px] rounded-md border w-full">
                            <div className="p-3 space-y-3 min-w-[380px]">
                                {BONDS.map(bond => (
                                    <React.Fragment key={bond}>
                                        <div
                                            className="flex justify-between cursor-pointer text-sm hover:bg-muted/40 p-2 rounded"
                                            onClick={() => {
                                                setSelectedBond(bond);
                                                setSelectedStock(null);
                                                loadPrice(bond);
                                            }}
                                        >
                                            <span className="font-medium">{bond}</span>
                                            <span className="text-muted-foreground">Trade</span>
                                        </div>
                                        <Separator />
                                    </React.Fragment>
                                ))}
                            </div>
                        </ScrollArea>

                        {selectedBond && (
                            <div className="mt-4 space-y-3">
                                <p className="font-medium">Selected: {selectedBond}</p>

                                <div>
                                    <p className="text-sm mb-1">Units</p>
                                    <Input type="number" min={1} value={units} onChange={e => setUnits(Number(e.target.value))} />
                                </div>

                                <p className="text-sm">Current Price: {price ? <b>${price.toFixed(2)}</b> : 'Loading...'}</p>

                                <Button onClick={onConfirm} className="w-full">
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
