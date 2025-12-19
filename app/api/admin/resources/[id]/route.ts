import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, url, type, description, visible } = await request.json();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (visible !== undefined) updateData.visible = visible;

    const resource = await prisma.resourceLink.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: resource });
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

    await prisma.resourceLink.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { message: 'Resource deleted successfully' } });
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
    const { visible } = await request.json();

    const resource = await prisma.resourceLink.update({
      where: { id },
      data: { visible }
    });

    return NextResponse.json({ success: true, data: resource });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}