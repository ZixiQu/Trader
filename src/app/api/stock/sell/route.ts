import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordTransaction } from '@/utils/recordTransaction';

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { symbol, quantity } = await req.json();
	const qty = Number(quantity);

	if (!symbol || qty <= 0) {
		return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

	try {
		await prisma.$transaction(async (tx) => {
			const holding = await tx.stock.findFirst({
				where: { userId: user.id, symbol },
			});

			if (!holding) throw new Error('NO_HOLDINGS');

			const ownedQty = holding.shares.toNumber();
			if (ownedQty < qty) throw new Error('NOT_ENOUGH_QUANTITY');

			const priceResp = await fetch(`${process.env.NEXTAUTH_URL}/api/price?asset=${symbol}`);
			const priceJson = await priceResp.json();
			const marketPrice = Number(priceJson.price);

			if (!marketPrice || marketPrice <= 0) {
				throw new Error('INVALID_MARKET_PRICE');
			}

			const totalGain = qty * marketPrice;

			const newQty = ownedQty - qty;

			if (newQty === 0) {
				await tx.stock.delete({ where: { id: holding.id } });
			} else {
				await tx.stock.update({
					where: { id: holding.id },
					data: { shares: newQty },
				});
			}

			await tx.user.update({
				where: { id: user.id },
				data: { cashBalance: { increment: totalGain } },
			});

			await recordTransaction(tx, {
				userId: user.id,
				type: 'SELL',
				assetType: 'STOCK',
				symbol,
				quantity: qty,
				price: marketPrice,
			});
		});

		return NextResponse.json({ success: true });
	} catch (err: any) {
		if (err.message === 'NO_HOLDINGS')
			return NextResponse.json({ error: 'You do not own this stock' }, { status: 404 });

		if (err.message === 'NOT_ENOUGH_QUANTITY')
			return NextResponse.json({ error: 'Not enough shares' }, { status: 400 });

		console.error('Stock SELL error:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
