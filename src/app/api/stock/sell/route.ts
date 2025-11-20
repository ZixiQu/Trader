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
		const holding = await tx.stock.findFirst({
			where: { userId, symbol },
		});

		if (!holding) {
			return NextResponse.json(
				{ error: 'No holdings found for this stock' },
				{ status: 400 },
			);
		}

		if (holding.shares < quantity) {
			return NextResponse.json({ error: 'Not enough shares to sell' }, { status: 400 });
		}

		const newShares = Number(holding.shares) - quantity;

		if (newShares === 0) {
			await tx.stock.delete({
				where: { id: holding.id },
			});
		} else {
			await tx.stock.update({
				where: { id: holding.id },
				data: { shares: newShares },
			});
		}

		await tx.user.update({
			where: { id: userId },
			data: { cashBalance: { increment: total } },
		});

		await recordTransaction(tx, {
			userId,
			type: 'SELL',
			assetType: 'STOCK',
			symbol,
			quantity,
			price,
		});

		return NextResponse.json({ success: true });
	});
}
