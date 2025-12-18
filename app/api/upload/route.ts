import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }
    const userId = payload.userId;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string || 'document';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (allow images and PDFs)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF and Images allowed' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const uniqueFilename = `${Date.now()}_${filename}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore error if it exists
    }

    const filepath = path.join(uploadDir, uniqueFilename);
    await writeFile(filepath, buffer);

    // Public URL path
    const publicPath = `/uploads/${uniqueFilename}`;

    const upload = await prisma.uploadedFile.create({
      data: {
        filename: filename, // Store original name (sanitized)
        filepath: publicPath,
        fileType: fileType,
        uploadedBy: userId
      }
    });

    return NextResponse.json({ success: true, data: upload });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const uploads = await prisma.uploadedFile.findMany({
      where: { uploadedBy: payload.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: uploads });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}