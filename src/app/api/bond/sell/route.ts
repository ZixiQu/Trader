import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
			const existing = await tx.bond.findFirst({
				where: { userId: user.id, symbol },
			});

			if (!existing) throw new Error('NO_HOLDINGS');

			const oldQty = existing.quantity.toNumber();
			if (oldQty < qty) throw new Error('NOT_ENOUGH_QUANTITY');

			const avg = existing.avgPrice.toNumber();

			const priceResp = await fetch(`${process.env.NEXTAUTH_URL}/api/price?asset=${symbol}`);
			const priceJson = await priceResp.json();
			const sellPrice = Number(priceJson.price);

			if (!sellPrice || sellPrice <= 0) {
				throw new Error('INVALID_MARKET_PRICE');
			}

			const totalGain = qty * sellPrice;

			const newQty = oldQty - qty;
			if (newQty === 0) {
				await tx.bond.delete({ where: { id: existing.id } });
			} else {
				await tx.bond.update({
					where: { id: existing.id },
					data: { quantity: newQty },
				});
			}

			await tx.user.update({
				where: { id: user.id },
				data: { cashBalance: { increment: totalGain } },
			});

			await tx.transaction.create({
				data: {
					userId: user.id,
					type: 'SELL',
					assetType: 'BOND',
					symbol,
					quantity: qty,
					price: sellPrice,
					total: totalGain,
				},
			});
		});

		return NextResponse.json({ success: true });
	} catch (err: any) {
		if (err.message === 'NO_HOLDINGS') {
			return NextResponse.json({ error: 'You do not own this bond' }, { status: 404 });
		}
		if (err.message === 'NOT_ENOUGH_QUANTITY') {
			return NextResponse.json({ error: 'Not enough quantity to sell' }, { status: 400 });
		}
		console.error('Bond SELL error:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
