import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// For Vercel compatibility, we don't actually store files on the server
// Instead, we validate the file and return success to indicate it was processed
// The actual file content is handled client-side and sent directly to the AI API

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
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

    // Since we're not storing files on the server, we just return a success response
    // The file content is handled client-side
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    
    console.log('File validation successful:', filename);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        validationSuccess: true,
        filename: filename,
        fileType: file.type
      } 
    });

  } catch (error) {
    console.error('Upload validation error:', error);
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