'use client';

import { useEffect, useState } from 'react';
import { BONDS, BondSymbol } from '@/constants/assets';
import { formatStockData } from '@/utils/formatStockData';
import { isMarketOpen } from '@/utils/marketStatus';

export function useBondData(active: BondSymbol | 'ALL', range: '1d' | '1mo' | '3mo') {
    const [data, setData] = useState<Record<string, any>>({});
    const interval = range === '1d' ? '1m' : '1d';

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const symbols = active === 'ALL' ? BONDS : [active];
            const results: Record<string, any> = {};

            await Promise.all(
                symbols.map(async symbol => {
                    // Reusing the stock API endpoint as it's just a proxy to Yahoo Finance
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

        const timer = setInterval(() => {
            // For bonds, we treat them as 'BOND' type. If 'ALL' is selected, we still check bond market hours.
            const shouldUpdate = isMarketOpen('BOND', active === 'ALL' ? null : active);
            
            if (!document.hidden && shouldUpdate) {
                load();
            }
        }, 5000);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [active, range]);

    return data;
}
