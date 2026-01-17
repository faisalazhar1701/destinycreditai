import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Get user from auth token
        const authHeaders = request.headers;
        const authCookie = authHeaders.get('cookie');
        let token = null;
        
        if (authCookie) {
            const cookieMatch = authCookie.match(/auth_token=([^;]+)/);
            if (cookieMatch) {
                token = cookieMatch[1];
            }
        }
        
        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify and decode token
        const decoded = await verifyToken(token);
        
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const userId = decoded.userId;
        if (!userId) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Update user subscription status using raw query
        await prisma.$executeRaw`
            UPDATE "User" 
            SET "subscription_status" = 'UNSUBSCRIBED'::"SubscriptionStatus",
                "unsubscribed_at" = NOW()
            WHERE "id" = ${userId}
        `;

        // Get updated user data
        const userResult = await prisma.$queryRaw<Array<{ id: string; email: string; name: string | null }>>`
            SELECT id, email, name
            FROM "User"
            WHERE "id" = ${userId}
        `;

        const updatedUser = userResult[0];

        console.log(`[UNSUBSCRIBE] User ${updatedUser.email} unsubscribed from service`);

        return NextResponse.json({
            message: 'Successfully unsubscribed',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                subscription_status: 'UNSUBSCRIBED'
            }
        });

    } catch (error) {
        console.error('[UNSUBSCRIBE_ERROR]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}