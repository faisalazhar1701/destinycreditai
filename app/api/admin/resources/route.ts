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
    // if (!payload || payload.role !== 'ADMIN') {
    //   return { success: false, error: 'Forbidden', status: 403 };
    // }
    
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
    
    const resources = await prisma.resourceLink.findMany({
      orderBy: { id: 'desc' }
    });
    return NextResponse.json({ success: true, data: resources });
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
    
    const { title, url, type = 'EXTERNAL', description, visible = true } = await request.json();

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json({
        success: false,
        error: 'Title and URL are required'
      }, { status: 400 });
    }

    const resource = await prisma.resourceLink.create({
      data: {
        title,
        url,
        type,
        description: description || null,
        visible
      }
    });

    return NextResponse.json({ success: true, data: resource });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}