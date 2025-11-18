'use client';

import { useEffect, useState } from 'react';
import { STOCKS, StockSymbol } from '@/constants/stocks';
import { formatStockData } from '@/utils/formatStockData';

export function useStockData(active: StockSymbol | 'ALL', range: '1d' | '1mo' | '3mo') {
    const [data, setData] = useState<Record<string, any>>({});
    const interval = range === '1d' ? '1m' : '1d';

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const symbols = active === 'ALL' ? STOCKS : [active];
            const results: Record<string, any> = {};

            await Promise.all(
                symbols.map(async symbol => {
                    const res = await fetch(`/api/stock?symbol=${symbol}&range=${range}&interval=${interval}`, { cache: 'no-store' });
                    const json = await res.json();
                    results[symbol] = formatStockData(json);
                })
            );

            if (!cancelled) {
                setData(results);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [active, range]);

    return data;
}
