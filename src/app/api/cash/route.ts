import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordTransaction } from '@/utils/recordTransaction';

export async function GET() {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { cashBalance: true },
	});

	return NextResponse.json({
		cashBalance: Number(user?.cashBalance ?? 0),
	});
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await req.json();
	const { action, amount } = body;

	if (!action || !amount) {
		return NextResponse.json(
			{ error: 'Missing required fields: action (DEPOSIT/WITHDRAW), amount' },
			{ status: 400 },
		);
	}

	if (!['DEPOSIT', 'WITHDRAW'].includes(action)) {
		return NextResponse.json(
			{ error: 'Invalid action. Must be DEPOSIT or WITHDRAW' },
			{ status: 400 },
		);
	}

	const userId = session.user.id;
	const amt = Number(amount);

	if (isNaN(amt) || amt <= 0) {
		return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
	}

	try {
		await prisma.$transaction(async (tx) => {
			const user = await tx.user.findUnique({ where: { id: userId } });
			if (!user) throw new Error('USER_NOT_FOUND');

			if (action === 'WITHDRAW') {
				const balance = user.cashBalance.toNumber();
				if (balance < amt) throw new Error('INSUFFICIENT_FUNDS');
			}

			const operation = action === 'DEPOSIT' ? 'increment' : 'decrement';

			await tx.user.update({
				where: { id: userId },
				data: { cashBalance: { [operation]: amt } },
			});

			await recordTransaction(tx, {
				userId,
				type: action,
				assetType: 'CASH',
				symbol: 'CASH',
				quantity: 1,
				price: amt,
			});
		});

		const message = action === 'DEPOSIT' ? 'Deposit successful' : 'Withdrawal successful';
		return NextResponse.json({ success: true, message }, { status: 201 });
	} catch (err: any) {
		console.error('Cash operation error:', err);

		if (err.message === 'INSUFFICIENT_FUNDS') {
			return NextResponse.json({ error: 'Insufficient cash balance' }, { status: 400 });
		}
		if (err.message === 'USER_NOT_FOUND') {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
