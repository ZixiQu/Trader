import { TransactionType, AssetType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

interface RecordTxInput {
	userId: string;
	type: TransactionType;
	assetType: AssetType;
	symbol: string;
	quantity: number;
	price: number;
}

export async function recordTransaction(tx: Tx, input: RecordTxInput) {
	const { userId, type, assetType, symbol, quantity, price } = input;

	if (!userId) throw new Error('Missing userId');
	if (!symbol) throw new Error('Missing symbol');
	if (quantity <= 0) throw new Error('Quantity must be positive');
	if (price <= 0) throw new Error('Price must be positive');

	const total = quantity * price;

	return await tx.transaction.create({
		data: {
			userId,
			type,
			assetType,
			symbol,
			quantity,
			price,
			total,
		},
	});
}
