
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const letter = await prisma.creditLetter.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!letter) {
      return NextResponse.json({ success: false, error: 'Credit letter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: letter });
  } catch (error) {
    console.error('Error fetching credit letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch credit letter' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { bureau, creditorName, letterType, content, accountNumber, tone } = await request.json();

    // Validate required fields
    if (!bureau || !creditorName || !letterType || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bureau, creditorName, letterType, and content are required'
      }, { status: 400 });
    }

    const letter = await prisma.creditLetter.update({
      where: { id },
      data: { bureau, creditorName, letterType, content, accountNumber, tone }
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error) {
    console.error('Error updating credit letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to update credit letter' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.creditLetter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { message: 'Credit letter deleted successfully' } });
  } catch (error) {
    console.error('Error deleting credit letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete credit letter' }, { status: 500 });
  }
}