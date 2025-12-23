import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir, access, readdir, stat, unlink } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

/**
 * Ensures the temporary uploads directory exists
 */
async function ensureTempUploadDir() {
  const uploadDir = path.join(process.cwd(), 'public/temp_uploads');
  try {
    await mkdir(uploadDir, { recursive: true });
    // Check if directory is writable
    await access(uploadDir);
    return uploadDir;
  } catch (e) {
    console.error('Error creating/accessing temp upload directory:', e);
    throw e;
  }
}

/**
 * Cleans up temporary files that are older than the specified age (in minutes)
 */
async function cleanupTempFiles(maxAgeMinutes: number = 60) {
  try {
    const tempDir = path.join(process.cwd(), 'public', 'temp_uploads');
    const files = await readdir(tempDir);
    
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const fileStat = await stat(filePath);
      
      // Check if file is older than maxAgeMinutes
      if (now - fileStat.mtime.getTime() > maxAgeMinutes * 60 * 1000) {
        await unlink(filePath);
        console.log(`Cleaned up temporary file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}

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

    console.log('Upload request received for user:', userId, 'File:', file?.name, 'Size:', file?.size, 'Type:', file?.type);

    if (!file) {
      console.log('No file provided in upload request');
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    // Create a temporary filename with user ID and random string to avoid conflicts
    const uniqueFilename = `temp_${userId}_${Date.now()}_${randomBytes(8).toString('hex')}_${filename}`;
    
    // Ensure the temporary uploads directory exists
    let uploadDir;
    try {
      uploadDir = await ensureTempUploadDir();
    } catch (e) {
      console.error('Error creating/accessing temp upload directory:', e);
      return NextResponse.json({ success: false, error: `Upload directory error: ${(e as Error).message || 'Unable to create/access temp directory'}. Please contact administrator.` }, { status: 500 });
    }

    const filepath = path.join(uploadDir, uniqueFilename);
    try {
      await writeFile(filepath, buffer);
      console.log('File saved successfully:', filepath);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json({ success: false, error: 'Failed to save file. Check disk space and permissions.' }, { status: 500 });
    }

    // Clean up old temporary files (run cleanup in the background)
    cleanupTempFiles(60).catch(error => {
      console.error('Background temp file cleanup failed:', error);
    });

    // Return the temporary file path for immediate use
    const publicPath = `/temp_uploads/${uniqueFilename}`;
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        tempPath: publicPath,
        filename: filename,
        fileType: file.type
      } 
    });

  } catch (error) {
    console.error('Upload error:', error);
    // Provide more specific error messages for debugging
    if (error instanceof TypeError && error.message.includes('ReadableStream')) {
      return NextResponse.json({ success: false, error: 'File processing error. Please try a different file.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// GET route is no longer needed for temporary files
export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'GET not supported for temporary uploads' }, { status: 405 });
}