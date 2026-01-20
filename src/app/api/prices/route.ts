import { NextResponse } from 'next/server';

export async function GET(req: Request) {
	const url = new URL(req.url);
	const symbol = url.searchParams.get('symbol');

	if (!symbol) {
		return NextResponse.json(
			{ error: 'Missing required query parameter: symbol' },
			{ status: 400 },
		);
	}

	try {
		const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;

		const res = await fetch(yahooUrl, { cache: 'no-store' });
		const json = await res.json();

		const result = json.chart?.result?.[0];
		const close = result?.indicators?.quote?.[0]?.close;
		const lastPrice = close?.[close.length - 1];

		if (!lastPrice || lastPrice <= 0) {
			return NextResponse.json(
				{ error: 'Invalid or unavailable price data' },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			symbol,
			price: Number(lastPrice),
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error('Price fetch error:', err);
		return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
	}
}
