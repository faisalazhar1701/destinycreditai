import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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