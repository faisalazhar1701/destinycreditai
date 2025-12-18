import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const letter = await prisma.followUpLetter.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!letter) {
      return NextResponse.json({ success: false, error: 'Follow-up letter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: letter });
  } catch (error) {
    console.error('Error fetching follow-up letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch follow-up letter' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { day, content } = await request.json();

    // Validate required fields
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required'
      }, { status: 400 });
    }

    if (day && ![15, 30, 45].includes(day)) {
      return NextResponse.json({
        success: false,
        error: 'Day must be 15, 30, or 45'
      }, { status: 400 });
    }

    const letter = await prisma.followUpLetter.update({
      where: { id },
      data: { ...(day && { day }), content }
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error) {
    console.error('Error updating follow-up letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to update follow-up letter' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.followUpLetter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { message: 'Follow-up letter deleted successfully' } });
  } catch (error) {
    console.error('Error deleting follow-up letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete follow-up letter' }, { status: 500 });
  }
}