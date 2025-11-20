import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordTransaction } from '@/utils/recordTransaction';

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { symbol, quantity, price } = await req.json();
	if (!symbol || !quantity || !price) {
		return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
	}

	const userId = session.user.id;
	const total = quantity * price;

	return await prisma.$transaction(async (tx) => {
		const user = await tx.user.findUnique({ where: { id: userId } });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		if (Number(user.cashBalance) < total) {
			return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
		}

		await tx.user.update({
			where: { id: userId },
			data: { cashBalance: { decrement: total } },
		});

		const existing = await tx.stock.findFirst({
			where: { userId, symbol },
		});

		if (existing) {
			const newShares = existing.shares + quantity;
			const newAvg =
				(Number(existing.avgPrice) * Number(existing.shares) + total) / newShares;

			await tx.stock.update({
				where: { id: existing.id },
				data: { shares: newShares, avgPrice: newAvg },
			});
		} else {
			await tx.stock.create({
				data: { userId, symbol, shares: quantity, avgPrice: price },
			});
		}

		await recordTransaction(tx, {
			userId,
			type: 'BUY',
			assetType: 'STOCK',
			symbol,
			quantity,
			price,
		});

		return NextResponse.json({ success: true });
	});
}
