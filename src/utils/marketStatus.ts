export function isCrypto(symbol: string): boolean {
    return ['BTC-USD', 'ETH-USD', 'DOGE-USD'].includes(symbol);
}

export function isMarketOpen(assetType: 'STOCK' | 'BOND', symbol?: string | null): boolean {
    // 1. If it's a specific symbol and it's Crypto, market is always open
    if (symbol && isCrypto(symbol)) {
        return true;
    }

    // 2. If it's "Stocks" in general (or ALL), and includes crypto, we technically allow updates.
    // However, to save cost as requested, we might want to restrict this.
    // But since the Stocks list now includes Crypto, if we pause, Crypto charts will freeze.
    // Let's assume if the context includes Crypto, we stay open.
    // If symbol is null/undefined, it usually means "ALL".
    if (assetType === 'STOCK' && !symbol) {
        // "ALL" stocks selected. Since this includes Crypto, we return true (always open).
        return true;
    }

    // 3. For Bonds or specific non-crypto Stocks, check US Market Hours (ET)
    // Market Hours: Mon-Fri, 9:30 AM - 4:00 PM ET
    const now = new Date();
    const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const etNow = new Date(etString);
    
    const day = etNow.getDay(); // 0 = Sun, 6 = Sat
    const hour = etNow.getHours();
    const minute = etNow.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Closed on weekends
    if (day === 0 || day === 6) return false;

    // Open 9:30 (570 min) to 16:00 (960 min)
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;

    return totalMinutes >= marketOpen && totalMinutes < marketClose;
}
