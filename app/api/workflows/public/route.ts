import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Public endpoint - only fetch enabled workflows
    const workflows = await prisma.workflow.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Error fetching public workflows:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch workflows' }, { status: 500 });
  }
}