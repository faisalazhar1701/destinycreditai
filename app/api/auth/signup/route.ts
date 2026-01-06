export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
//  hannan just for testing 
/**
 * POST /api/auth/signup
 * 
 * DISABLED: Public signup is blocked for Zapier-only access
 * Only users created via Zapier integration can access the system
 * 
 * This endpoint now returns an error to prevent free signup
 */
//added the comment for testing and dummy code to deploy on vercel.

export async function POST(request: Request) {
    console.log('🚫 Blocked signup attempt - public signup disabled');
    
    // Log the attempt for monitoring purposes
    try {
        const body = await request.json();
        console.log('Blocked signup attempt for email:', body.email);
    } catch (error) {
        console.log('Blocked signup attempt - could not parse request');
    }
    
    // Return error response explaining that signup is disabled
    return NextResponse.json(
        { 
            error: 'Public signup is disabled. Access is available only through purchased plans via Kartra integration.',
            message: 'Please purchase a plan through our official channels to gain access.'
        }, 
        { 
            status: 403 // Forbidden
        }
    );
}
