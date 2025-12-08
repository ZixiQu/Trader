'use client';

import { useEffect, useState } from 'react';
import { CRYPTO, CryptoSymbol } from '@/constants/assets';
import { formatStockData } from '@/utils/formatStockData';

export function useCryptoData(active: CryptoSymbol | 'ALL', range: '1d' | '1mo' | '3mo') {
    const [data, setData] = useState<Record<string, any>>({});
    const interval = range === '1d' ? '1m' : '1d';

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const symbols = active === 'ALL' ? CRYPTO : [active];
            const results: Record<string, any> = {};

            await Promise.all(
                symbols.map(async symbol => {
                    // Reusing the stock API endpoint as it works for crypto too
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
            if (!document.hidden) {
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
