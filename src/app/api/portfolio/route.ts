import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const userId = session.user.id;

	const [user, stocks, bonds] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { cashBalance: true },
		}),
		prisma.stock.findMany({
			where: { userId },
		}),
		prisma.bond.findMany({
			where: { userId },
		}),
	]);

	return NextResponse.json({
		cash: Number(user?.cashBalance ?? 0),
		stocks,
		bonds,
	});
}
