import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function authenticateAdmin() {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    
    if (!token) {
      return { success: false, error: 'Unauthorized', status: 401 };
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden', status: 403 };
    }
    
    return { success: true, payload };
  } catch (error) {
    return { success: false, error: 'Authentication error', status: 500 };
  }
}

export async function GET() {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const letters = await prisma.followUpLetter.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    return NextResponse.json({ success: true, data: letters });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { userId, day, content } = await request.json();

    // Validate required fields
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required'
      }, { status: 400 });
    }

    if (!day || ![15, 30, 45].includes(day)) {
      return NextResponse.json({
        success: false,
        error: 'Day must be 15, 30, or 45'
      }, { status: 400 });
    }

    // Ensure user exists or create default user
    let user = await prisma.user.findFirst({ where: { email: 'demo@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'USER',
          password: 'password123' // Default password required by schema
        }
      });
    }

    // Use existing user or verify provided userId exists
    let finalUserId = user.id;
    if (userId) {
      const existingUser = await prisma.user.findUnique({ where: { id: String(userId) } });
      if (existingUser) {
        finalUserId = existingUser.id;
      }
    }

    const letter = await prisma.followUpLetter.create({
      data: {
        userId: finalUserId,
        day: Number(day),
        content
      }
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}