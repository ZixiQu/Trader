import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { symbol, quantity, price } = await req.json();
	const qty = Number(quantity);
	const p = Number(price);

	if (!symbol || qty <= 0 || p <= 0) {
		return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

	const totalCost = qty * p;

	try {
		await prisma.$transaction(async (tx) => {
			const balance = user.cashBalance.toNumber();
			if (balance < totalCost) {
				throw new Error('INSUFFICIENT_FUNDS');
			}

			await tx.user.update({
				where: { id: user.id },
				data: { cashBalance: { decrement: totalCost } },
			});

			const existing = await tx.bond.findFirst({
				where: { userId: user.id, symbol },
			});

			if (!existing) {
				await tx.bond.create({
					data: {
						userId: user.id,
						symbol,
						quantity: qty,
						avgPrice: p,
					},
				});
			} else {
				const oldQty = existing.quantity.toNumber();
				const oldAvg = existing.avgPrice.toNumber();

				const newQty = oldQty + qty;
				const newAvg = (oldQty * oldAvg + qty * p) / newQty;

				await tx.bond.update({
					where: { id: existing.id },
					data: {
						quantity: newQty,
						avgPrice: newAvg,
					},
				});
			}

			await tx.transaction.create({
				data: {
					userId: user.id,
					type: 'BUY',
					assetType: 'BOND',
					symbol,
					quantity: qty,
					price: p,
					total: totalCost,
				},
			});
		});

		return NextResponse.json({ success: true });
	} catch (err: any) {
		if (err.message === 'INSUFFICIENT_FUNDS') {
			return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
		}
		console.error('Bond BUY error:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
