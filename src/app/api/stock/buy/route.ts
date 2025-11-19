import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { recordTransaction } from '@/utils/transaction';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { userId, symbol, quantity, price } = await req.json();

        if (!userId || !symbol || !quantity || !price) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const total = quantity * price;

        return await prisma.$transaction(async tx => {
            const user = await tx.user.findUnique({ where: { id: userId } });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            if (Number(user.cashBalance) < total) {
                return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
            }

            const existing = await tx.stock.findFirst({
                where: { userId, symbol }
            });

            if (existing) {
                const newShares = existing.shares + quantity;
                const newAvg = (Number(existing.avgPrice) * Number(existing.shares) + total) / newShares;

                await tx.stock.update({
                    where: { id: existing.id },
                    data: {
                        shares: newShares,
                        avgPrice: newAvg
                    }
                });
            } else {
                await tx.stock.create({
                    data: {
                        userId,
                        symbol,
                        shares: quantity,
                        avgPrice: price
                    }
                });
            }

            await recordTransaction(tx, {
                userId,
                type: 'BUY',
                assetType: 'STOCK',
                symbol,
                quantity,
                price
            });

            return NextResponse.json({ success: true });
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
