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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await context.params;
    const { name, steps, enabled } = await request.json();
    
    let parsedSteps = steps;
    if (steps && typeof steps === 'string') {
      try {
        parsedSteps = JSON.parse(steps);
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid JSON in steps field' }, { status: 400 });
      }
    }
    
    const workflow = await prisma.workflow.update({
      where: { id },
      data: { name, steps: parsedSteps, enabled }
    });
    
    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await context.params;
    
    await prisma.workflow.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, data: { message: 'Workflow deleted successfully' } });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete workflow' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateAdmin();
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await context.params;
    const { enabled } = await request.json();
    
    const workflow = await prisma.workflow.update({
      where: { id },
      data: { enabled }
    });
    
    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}