import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { symbol, quantity, price, assetType } = await req.json();
    const qty = Number(quantity);

    if (!symbol || !qty || !price || !assetType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const totalCost = qty * price;

    // update cash
    await prisma.user.update({
        where: { id: user.id },
        data: { cashBalance: Number(user.cashBalance) - totalCost }
    });

    if (assetType === 'STOCK') {
        const existing = await prisma.stock.findFirst({
            where: { userId: user.id, symbol }
        });

        if (!existing) {
            await prisma.stock.create({
                data: { userId: user.id, symbol, shares: qty, avgPrice: price }
            });
        } else {
            const newShares = existing.shares.toNumber() + qty;
            const newAvg = (existing.avgPrice.toNumber() * existing.shares.toNumber() + qty * price) / newShares;

            await prisma.stock.update({
                where: { id: existing.id },
                data: { shares: newShares, avgPrice: newAvg }
            });
        }
    }

    if (assetType === 'BOND') {
        const existing = await prisma.bond.findFirst({
            where: { userId: user.id, symbol }
        });

        if (!existing) {
            await prisma.bond.create({
                data: { userId: user.id, symbol, quantity: qty, avgPrice: price }
            });
        } else {
            const newQty = existing.quantity.toNumber() + qty;
            const newAvg = (existing.avgPrice.toNumber() * existing.quantity.toNumber() + qty * price) / newQty;

            await prisma.bond.update({
                where: { id: existing.id },
                data: { quantity: newQty, avgPrice: newAvg }
            });
        }
    }

    await prisma.transaction.create({
        data: {
            userId: user.id,
            type: 'BUY',
            assetType,
            symbol,
            quantity: qty,
            price,
            total: totalCost
        }
    });

    return NextResponse.json({ success: true });
}
