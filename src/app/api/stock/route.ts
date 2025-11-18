import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const urlReq = new URL(req.url);

    const symbol = urlReq.searchParams.get('symbol');
    const range = urlReq.searchParams.get('range') || '1d';
    const interval = urlReq.searchParams.get('interval') || '1m';

    if (!symbol) {
        return NextResponse.json({ error: 'Missing ?symbol=' });
    }

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;

    try {
        const res = await fetch(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: '*/*'
            },
            cache: 'no-store'
        });

        const json = await res.json();
        return NextResponse.json(json);
    } catch (e) {
        return NextResponse.json({ error: 'Yahoo fetch failed', details: e });
    }
}
