import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Public endpoint - only fetch enabled AI prompts (excluding system prompts)
    const prompts = await prisma.aIPrompt.findMany({
      where: { 
        enabled: true,
        type: { not: 'system' }
      }
    });
    return NextResponse.json({ success: true, data: prompts });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}