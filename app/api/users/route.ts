import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { letters: true, followUps: true }
        }
      }
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role = 'USER' } = await request.json();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role.toUpperCase() as 'USER' | 'ADMIN',
        password: 'password123', // Default password required by schema
        subscription_status: 'ACTIVE' as any // Explicitly set to active to ensure access
      }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}