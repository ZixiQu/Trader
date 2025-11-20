type StockPoint = {
  date: string;
  price: number | null;
};

export function formatStockData(raw: any): StockPoint[] {
  try {
    const result = raw?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp ?? [];
    const close = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
      .map(
        (t: number, i: number): StockPoint => ({
          date: new Date(t * 1000).toISOString(),
          price: close[i] ?? null,
        }),
      )
      .filter((d: StockPoint) => d.price !== null);
  } catch {
    return [];
  }
}
