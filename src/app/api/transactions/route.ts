import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordTransaction } from '@/utils/recordTransaction';

export async function GET(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const url = new URL(req.url);
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = parseInt(url.searchParams.get('limit') || '10', 10);
	const skip = (page - 1) * limit;

	const userId = session.user.id;

	const [transactions, totalCount] = await Promise.all([
		prisma.transaction.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.transaction.count({ where: { userId } }),
	]);

	return NextResponse.json({
		data: transactions,
		pagination: {
			page,
			limit,
			totalPages: Math.ceil(totalCount / limit),
			total: totalCount,
		},
	});
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await req.json();
	const { action, assetType, symbol, quantity, price } = body;

	if (!action || !assetType || !symbol || !quantity || !price) {
		return NextResponse.json(
			{ error: 'Missing required fields: action, assetType, symbol, quantity, price' },
			{ status: 400 },
		);
	}

	if (!['BUY', 'SELL'].includes(action)) {
		return NextResponse.json({ error: 'Invalid action. Must be BUY or SELL' }, { status: 400 });
	}

	if (!['STOCK', 'BOND', 'CASH'].includes(assetType)) {
		return NextResponse.json(
			{ error: 'Invalid assetType. Must be STOCK, BOND, or CASH' },
			{ status: 400 },
		);
	}

	const userId = session.user.id;
	const qty = Number(quantity);
	const p = Number(price);

	if (isNaN(qty) || isNaN(p) || qty <= 0 || p <= 0) {
		return NextResponse.json({ error: 'Invalid quantity or price' }, { status: 400 });
	}

	const total = qty * p;

	try {
		if (action === 'BUY') {
			await prisma.$transaction(async (tx) => {
				const user = await tx.user.findUnique({ where: { id: userId } });
				if (!user) throw new Error('USER_NOT_FOUND');

				const balance = user.cashBalance.toNumber();
				if (balance < total) throw new Error('INSUFFICIENT_FUNDS');

				// Deduct cash
				await tx.user.update({
					where: { id: userId },
					data: { cashBalance: { decrement: total } },
				});

				// Handle asset type
				if (assetType === 'STOCK') {
					const existing = await tx.stock.findFirst({ where: { userId, symbol } });

					if (existing) {
						const newShares = existing.shares.toNumber() + qty;
						const newAvg =
							(existing.avgPrice.toNumber() * existing.shares.toNumber() + total) /
							newShares;

						await tx.stock.update({
							where: { id: existing.id },
							data: { shares: newShares, avgPrice: newAvg },
						});
					} else {
						await tx.stock.create({
							data: { userId, symbol, shares: qty, avgPrice: p },
						});
					}
				} else if (assetType === 'BOND') {
					const existing = await tx.bond.findFirst({ where: { userId, symbol } });

					if (existing) {
						const newQty = existing.quantity.toNumber() + qty;
						const newAvg =
							(existing.avgPrice.toNumber() * existing.quantity.toNumber() + total) /
							newQty;

						await tx.bond.update({
							where: { id: existing.id },
							data: { quantity: newQty, avgPrice: newAvg },
						});
					} else {
						await tx.bond.create({
							data: { userId, symbol, quantity: qty, avgPrice: p },
						});
					}
				}

				await recordTransaction(tx, {
					userId,
					type: 'BUY',
					assetType,
					symbol,
					quantity: qty,
					price: p,
				});
			});

			return NextResponse.json(
				{ success: true, message: 'Buy transaction completed' },
				{ status: 201 },
			);
		} else if (action === 'SELL') {
			await prisma.$transaction(async (tx) => {
				const user = await tx.user.findUnique({ where: { id: userId } });
				if (!user) throw new Error('USER_NOT_FOUND');

				if (assetType === 'STOCK') {
					const holding = await tx.stock.findFirst({ where: { userId, symbol } });
					if (!holding) throw new Error('NO_HOLDINGS');

					const ownedQty = holding.shares.toNumber();
					if (ownedQty < qty) throw new Error('NOT_ENOUGH_QUANTITY');

					const newQty = ownedQty - qty;
					if (newQty === 0) {
						await tx.stock.delete({ where: { id: holding.id } });
					} else {
						await tx.stock.update({
							where: { id: holding.id },
							data: { shares: newQty },
						});
					}
				} else if (assetType === 'BOND') {
					const holding = await tx.bond.findFirst({ where: { userId, symbol } });
					if (!holding) throw new Error('NO_HOLDINGS');

					const ownedQty = holding.quantity.toNumber();
					if (ownedQty < qty) throw new Error('NOT_ENOUGH_QUANTITY');

					const newQty = ownedQty - qty;
					if (newQty === 0) {
						await tx.bond.delete({ where: { id: holding.id } });
					} else {
						await tx.bond.update({
							where: { id: holding.id },
							data: { quantity: newQty },
						});
					}
				}

				// Add cash
				await tx.user.update({
					where: { id: userId },
					data: { cashBalance: { increment: total } },
				});

				await recordTransaction(tx, {
					userId,
					type: 'SELL',
					assetType,
					symbol,
					quantity: qty,
					price: p,
				});
			});

			return NextResponse.json(
				{ success: true, message: 'Sell transaction completed' },
				{ status: 201 },
			);
		}
	} catch (err: any) {
		console.error('Transaction error:', err);

		if (err.message === 'INSUFFICIENT_FUNDS') {
			return NextResponse.json({ error: 'Insufficient cash balance' }, { status: 400 });
		}
		if (err.message === 'USER_NOT_FOUND') {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}
		if (err.message === 'NO_HOLDINGS') {
			return NextResponse.json(
				{ error: `You do not own this ${assetType.toLowerCase()}` },
				{ status: 404 },
			);
		}
		if (err.message === 'NOT_ENOUGH_QUANTITY') {
			return NextResponse.json({ error: 'Not enough quantity to sell' }, { status: 400 });
		}

		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
