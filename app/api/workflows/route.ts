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
    if (!payload || payload.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden', status: 403 };
    }
    
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
    
    const workflows = await prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const body = await request.json();
    const { name, steps, enabled = true } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: 'Workflow name is required' }, { status: 400 });
    }
    
    // Validate steps format
    let parsedSteps = { steps: [] };
    if (steps) {
      if (typeof steps === 'string') {
        try {
          parsedSteps = JSON.parse(steps);
          // Ensure steps has the correct structure
          if (!parsedSteps.steps || !Array.isArray(parsedSteps.steps)) {
            parsedSteps = { steps: [] };
          }
        } catch (e) {
          return NextResponse.json({ success: false, error: 'Invalid JSON in steps field. Expected format: {"steps": ["Step 1", "Step 2"]}' }, { status: 400 });
        }
      } else {
        parsedSteps = steps;
        // Ensure steps has the correct structure
        if (!parsedSteps.steps || !Array.isArray(parsedSteps.steps)) {
          parsedSteps = { steps: [] };
        }
      }
    }
    
    const workflow = await prisma.workflow.create({
      data: { name, steps: parsedSteps, enabled }
    });
    
    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}