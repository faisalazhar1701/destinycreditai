import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const toggles = await prisma.featureToggle.findMany({
      orderBy: { feature_name: 'asc' },
    });

    return NextResponse.json(toggles);
  } catch (error) {
    console.error('Feature toggles GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature toggles' },
      { status: 500 }
    );
  }
}
