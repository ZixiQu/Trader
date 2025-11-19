import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.transaction.count({ where: { userId: user.id } })
    ]);

    return NextResponse.json({
        transactions,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
    });
}
