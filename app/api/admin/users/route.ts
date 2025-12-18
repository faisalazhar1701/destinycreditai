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
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role = 'USER', active = true, password } = await request.json();

    // Hash password (default to 'password123' if not provided)
    const passwordToHash = password || 'password123';
    // Import bcrypt dynamically to avoid issues if not used elsewhere, or standard import if it is. 
    // Since it's an API route, standard require/import is better. 
    // But this file didn't have bcrypt imported.
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role.toUpperCase() as 'USER' | 'ADMIN',
        active,
        password: hashedPassword
      }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}