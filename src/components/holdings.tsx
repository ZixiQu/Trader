'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const holdings = [
    { symbol: 'AMZN', shares: 3, profit: 125.45 },
    { symbol: 'AAPL', shares: 5, profit: -32.1 },
    { symbol: 'NVDA', shares: 2, profit: 240.0 },
    { symbol: 'MSFT', shares: 4, profit: -12.57 },
    { symbol: 'TSLA', shares: 1, profit: 90.22 }
];

export function Holdings() {
    return (
        <ScrollArea className="h-95 w-100 rounded-md border">
            <div className="p-4 space-y-3">
                <h4 className="text-sm font-medium mb-4">Your Holdings</h4>

                {holdings.map(h => (
                    <React.Fragment key={h.symbol}>
                        <div className="flex justify-between text-md">
                            <div>
                                <span className="font-semibold">{h.symbol}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground ml-2">{h.shares} shares</span>
                            </div>

                            <span className={h.profit >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                {h.profit >= 0 ? '+' : '-'}${Math.abs(h.profit).toFixed(2)}
                            </span>
                        </div>
                        <Separator />
                    </React.Fragment>
                ))}
            </div>
        </ScrollArea>
    );
}
