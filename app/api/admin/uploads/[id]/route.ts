import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get the file info before deleting from DB
    const upload = await prisma.uploadedFile.findUnique({
      where: { id }
    });

    if (upload) {
      // Delete physical file if it's an internal path
      if (upload.filepath.startsWith('/uploads/')) {
        try {
          const fullPath = path.join(process.cwd(), 'public', upload.filepath);
          await unlink(fullPath);
        } catch (e) {
          console.error('Failed to delete physical file:', e);
        }
      }

      await prisma.uploadedFile.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true, data: { message: 'Upload deleted successfully' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}