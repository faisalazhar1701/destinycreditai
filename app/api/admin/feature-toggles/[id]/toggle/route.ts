import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid enabled value' },
        { status: 400 }
      );
    }

    const updatedToggle = await prisma.featureToggle.update({
      where: { id },
      data: {
        enabled,
        updated_at: new Date()
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedToggle,
    });
  } catch (error) {
    console.error('Feature toggle PATCH error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to toggle feature' },
      { status: 500 }
    );
  }
}
