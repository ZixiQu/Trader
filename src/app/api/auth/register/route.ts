import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
	try {
		const { email, password, name } = await req.json();

		if (!email || !password || !name) {
			return NextResponse.json(
				{ error: 'Missing required fields: email, password, name' },
				{ status: 400 },
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Validate password length
		if (password.length < 8) {
			return NextResponse.json(
				{ error: 'Password must be at least 8 characters' },
				{ status: 400 },
			);
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
		}

		const hashedPassword = await hash(password, 12);

		const user = await prisma.user.create({
			data: {
				email,
				name,
				hashedPassword,
			},
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
			},
		});

		return NextResponse.json(
			{ message: 'User registered successfully', user },
			{ status: 201 },
		);
	} catch (err) {
		console.error('Registration error:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
