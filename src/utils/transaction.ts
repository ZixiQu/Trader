import { PrismaClient, TransactionType, AssetType } from '@prisma/client';

export async function recordTransaction(tx: PrismaClient, { userId, type, assetType, symbol, quantity, price }: { userId: string; type: TransactionType; assetType: AssetType; symbol: string; quantity: number; price: number }) {
    const total = quantity * price;

    if (assetType === 'CASH') {
        if (type === 'DEPOSIT') {
            await tx.user.update({
                where: { id: userId },
                data: { cashBalance: { increment: total } }
            });
        }

        if (type === 'WITHDRAW') {
            await tx.user.update({
                where: { id: userId },
                data: { cashBalance: { decrement: total } }
            });
        }
    }

    if (assetType === 'STOCK' || assetType === 'BOND') {
        if (type === 'BUY') {
            await tx.user.update({
                where: { id: userId },
                data: { cashBalance: { decrement: total } }
            });
        }

        if (type === 'SELL') {
            await tx.user.update({
                where: { id: userId },
                data: { cashBalance: { increment: total } }
            });
        }
    }

    return await tx.transaction.create({
        data: {
            userId,
            type,
            assetType,
            symbol,
            quantity,
            price,
            total
        }
    });
}
