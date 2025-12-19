import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { email, username, password } = await request.json();
        const identifier = email || username;

        if (!identifier || !password) {
            return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Email does not exist' }, { status: 401 });
        }

        // Since we added password recently, old users might not have it.
        // Ideally we should handle migration, but for now assuming new flow.
        if (!user.password) {
            return NextResponse.json({ error: 'Please reset your password' }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Create session token
        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        // Set cookie
        (await cookies()).set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            // maxAge omitted to make it a session cookie
            path: '/',
        });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
