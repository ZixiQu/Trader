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

	const { amount } = await req.json();

	if (!amount || typeof amount !== 'number' || amount <= 0) {
		return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
	}

	const userId = session.user.id;

	try {
		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: { cashBalance: { increment: amount } },
			});

			await recordTransaction(tx, {
				userId,
				type: 'DEPOSIT',
				assetType: 'CASH',
				symbol: 'CASH',
				quantity: amount,
				price: 1,
			});
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Deposit error:', err);
		return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
	}
}
