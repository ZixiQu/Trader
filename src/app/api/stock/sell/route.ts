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

        return await prisma.$transaction(async tx => {
            const holding = await tx.stock.findFirst({
                where: { userId, symbol }
            });

            if (!holding) {
                return NextResponse.json({ error: 'No holdings found for this stock' }, { status: 400 });
            }

            if (holding.shares < quantity) {
                return NextResponse.json({ error: 'Not enough shares to sell' }, { status: 400 });
            }

            const newShares = holding.shares - quantity;

            if (newShares === 0) {
                // Delete holding when fully sold
                await tx.stock.delete({ where: { id: holding.id } });
            } else {
                await tx.stock.update({
                    where: { id: holding.id },
                    data: { shares: newShares }
                });
            }

            // Record transaction
            await recordTransaction({
                userId,
                type: 'SELL',
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
