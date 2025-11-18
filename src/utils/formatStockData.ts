// utils/formatYahoo.ts
export function formatStockData(raw: any) {
    try {
        const result = raw?.chart?.result?.[0];
        if (!result) return [];

        const timestamps = result.timestamp ?? [];
        const close = result.indicators?.quote?.[0]?.close ?? [];

        return timestamps
            .map((t: number, i: number) => ({
                date: new Date(t * 1000).toISOString(),
                price: close[i] ?? null
            }))
            .filter(d => d.price !== null);
    } catch {
        return [];
    }
}
