import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { recordTransaction } from '@/utils/transaction';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { userId, amount } = await req.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid deposit request' }, { status: 400 });
        }

        return await prisma.$transaction(async tx => {
            // manually increase cash before recording the transaction
            await tx.user.update({
                where: { id: userId },
                data: { cashBalance: { increment: amount } }
            });

            await recordTransaction(tx, {
                userId,
                type: 'DEPOSIT',
                assetType: 'CASH',
                symbol: 'CASH',
                quantity: amount,
                price: 1
            });

            return NextResponse.json({
                success: true,
                deposited: amount
            });
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
