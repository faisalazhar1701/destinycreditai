import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    // Role check for admin or user (users should see their own, admins see all?)
    // Actually this is an admin route, so role check strictly for ADMIN
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const uploads = await prisma.uploadedFile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    return NextResponse.json({ success: true, data: uploads });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (allow images and PDFs)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF and Images allowed' }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
      // Check if directory is writable
      await access(uploadDir);
    } catch (e) {
      console.error('Error creating/accessing upload directory:', e);
      return NextResponse.json({ success: false, error: 'Upload directory error. Please contact administrator.' }, { status: 500 });
    }

    const filepath = path.join(uploadDir, filename);
    try {
      await writeFile(filepath, buffer);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json({ success: false, error: 'Failed to save file. Check disk space and permissions.' }, { status: 500 });
    }

    const publicPath = `/uploads/${filename}`;

    const upload = await prisma.uploadedFile.create({
      data: {
        filename: file.name,
        filepath: publicPath,
        fileType: fileType || file.type || 'document',
        uploadedBy: payload.userId
      }
    });

    return NextResponse.json({ success: true, data: upload });
  } catch (error) {
    console.error('Upload error:', error);
    // Provide more specific error messages for debugging
    if (error instanceof TypeError && error.message.includes('ReadableStream')) {
      return NextResponse.json({ success: false, error: 'File processing error. Please try a different file.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}