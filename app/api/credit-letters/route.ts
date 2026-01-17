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
    
    const payload = await verifyToken(token);
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
    
    const letters = await prisma.creditLetter.findMany({
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
    
    const { userId, bureau, creditorName, accountNumber, letterType, tone, content } = await request.json();

    // Validate required fields
    if (!bureau || !creditorName || !letterType || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bureau, creditorName, letterType, and content are required'
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

    const letter = await prisma.creditLetter.create({
      data: {
        userId: finalUserId,
        bureau,
        creditorName,
        accountNumber,
        letterType,
        tone: tone || 'professional',
        content
      }
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}