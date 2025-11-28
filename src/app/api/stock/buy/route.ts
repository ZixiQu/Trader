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

	const body = await req.json();
	const symbol = body.symbol;
	const quantity = Number(body.quantity);
	const price = Number(body.price);

	if (!symbol || isNaN(quantity) || isNaN(price)) {
		return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
	}

	const userId = session.user.id;
	const total = quantity * price;

	try {
		await prisma.$transaction(async (tx) => {
			const user = await tx.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				throw new Error('USER_NOT_FOUND');
			}

			const balance = user.cashBalance.toNumber();

			if (balance < total) {
				throw new Error('INSUFFICIENT_FUNDS');
			}

			await tx.user.update({
				where: { id: userId },
				data: {
					cashBalance: { decrement: total },
				},
			});

			const existing = await tx.stock.findFirst({
				where: { userId, symbol },
			});

			if (existing) {
				const newShares = existing.shares.toNumber() + quantity;
				const newAvg =
					(existing.avgPrice.toNumber() * existing.shares.toNumber() + total) / newShares;

				await tx.stock.update({
					where: { id: existing.id },
					data: {
						shares: newShares,
						avgPrice: newAvg,
					},
				});
			} else {
				await tx.stock.create({
					data: {
						userId,
						symbol,
						shares: quantity,
						avgPrice: price,
					},
				});
			}

			// Record transaction
			await recordTransaction(tx, {
				userId,
				type: 'BUY',
				assetType: 'STOCK',
				symbol,
				quantity,
				price,
			});
		});

		return NextResponse.json({ success: true });
	} catch (err: any) {
		console.error('Trade error:', err);

		if (err.message === 'INSUFFICIENT_FUNDS') {
			return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
		}
		if (err.message === 'USER_NOT_FOUND') {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
