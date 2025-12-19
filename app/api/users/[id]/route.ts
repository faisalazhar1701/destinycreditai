
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { name, email, role, active } = await request.json();
    const user = await prisma.user.update({
      where: { id: id }, // Use the directly accessed id
      data: {
        name,
        email,
        role: role?.toUpperCase(),
        active,
        lastLogin: active ? new Date() : undefined
      }
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    console.log('Deleting user with ID:', params.id);
    const deletedUser = await prisma.user.delete({
      where: { id: params.id }
    });
    console.log('User deleted successfully:', deletedUser.email);
    return NextResponse.json({ success: true, deletedUser });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user: ' + (error as Error).message }, { status: 500 });
  }
}