import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const urlReq = new URL(req.url);
    const asset = urlReq.searchParams.get('asset');

    if (!asset) {
        return NextResponse.json({ error: 'Missing asset param' }, { status: 400 });
    }

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${asset}?range=1d&interval=1m`;

    try {
        const res = await fetch(yahooUrl, { cache: 'no-store' });
        const json = await res.json();
        const result = json.chart?.result?.[0];
        const close = result?.indicators?.quote?.[0]?.close;
        const lastPrice = close?.[close.length - 1];

        return NextResponse.json({ price: Number(lastPrice) });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
    }
}
