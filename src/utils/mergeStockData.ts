export function mergeStockData(all: Record<string, any[]>) {
    const merged: Record<string, any> = {};

    Object.entries(all).forEach(([symbol, rows]) => {
        rows.forEach(row => {
            const key = row.date;
            if (!merged[key]) merged[key] = { date: key };
            merged[key][symbol] = row.price;
        });
    });

    return Object.values(merged).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
