import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Use jose for Edge Runtime compatibility
export async function signToken(payload: any): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
    return token;
}

export async function verifyToken(token: string): Promise<any> {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        console.log('🔓 Token verified successfully:', payload);
        return payload;
    } catch (error: any) {
        console.error('❌ Token verification failed:', error.message);
        return null;
    }
}

// Check if user has valid subscription based on role
// ADMIN users bypass subscription checks
// USER users must have valid subscription status
export function hasValidSubscription(user: any): boolean {
    // ADMIN users always have access
    if (user.role === 'ADMIN') {
        return true;
    }
    
    // For USER role, check subscription status
    // Block only if subscription_status === 'unsubscribed'
    // New users or users without this field must NOT be blocked
    if (user.role === 'USER') {
        // If subscription_status is 'unsubscribed', deny access
        // Otherwise allow access (including if field doesn't exist or has other values)
        return user.subscription_status !== 'unsubscribed';
    }
    
    return false;
}