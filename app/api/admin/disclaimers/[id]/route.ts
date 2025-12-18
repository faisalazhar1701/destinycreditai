import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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