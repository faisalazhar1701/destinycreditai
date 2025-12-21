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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await params;
    const { type, content, enabled } = await request.json();

    const disclaimer = await prisma.disclaimer.update({
      where: { id },
      data: { type, content, enabled }
    });

    return NextResponse.json({ success: true, data: disclaimer });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await params;

    await prisma.disclaimer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { message: 'Disclaimer deleted successfully' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await params;
    const { enabled } = await request.json();

    const disclaimer = await prisma.disclaimer.update({
      where: { id },
      data: { enabled }
    });

    return NextResponse.json({ success: true, data: disclaimer });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}