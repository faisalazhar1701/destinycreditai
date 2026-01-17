import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { readFile, unlink } from 'fs/promises';
import { appendFileSync } from 'fs';
import path from 'path';

// Note: We're not using deleteTempFile since we're not storing files on the server

const DEBUG_LOG = path.join(process.cwd(), 'debug_api.log');
function logDebug(msg: string) {
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(DEBUG_LOG, `[${timestamp}] ${msg}\n`);
  } catch (e) {
    console.error('Logging failed:', e);
  }
}

// Moved inside to avoid potential top-level initialization issues
let openai: OpenAI;

export const maxDuration = 300; // 5 minutes max duration for the route

export async function POST(request: NextRequest) {
  logDebug('--- Letter Generation Request Started ---');
  if (!openai) {
    logDebug('Initializing OpenAI client...');
    if (!process.env.OPENAI_API_KEY) {
      console.error('CRITICAL: OPENAI_API_KEY is missing');
      return NextResponse.json({ success: false, error: 'AI Service configuration missing' }, { status: 500 });
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 240000,
    });
  }
  try {
    // Authenticate user
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      logDebug('Auth failed: No token');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload?.userId) {
      logDebug('Auth failed: Invalid token');
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }
    const userId = payload.userId;
    logDebug(`User authenticated: ${userId}`);

    let body;
    try {
      body = await request.json();
      logDebug('Request body parsed successfully');
    } catch (e) {
      logDebug(`Failed to parse request body: ${e}`);
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      userName,
      userAddress,
      creditorName,
      accountNumber,
      disputeReason,
      bureau,
      letterType,
      documentContent, // Direct content from client-side
      fullSystemPrompt // Optional override
    } = body;

    // Get AI prompts from database
    const startPrompts = Date.now();
    logDebug('Fetching prompts from database...');
    const promptsData = await prisma.aIPrompt.findMany({ where: { enabled: true } });
    logDebug(`Found ${promptsData.length} prompts (took ${Date.now() - startPrompts}ms)`);
    const prompts = promptsData.reduce((acc: any, prompt: any) => {
      acc[prompt.type] = prompt.content;
      return acc;
    }, {});

    const systemPrompt = prompts.system || `You are an AI assistant that helps create educational credit dispute letters. CRITICAL COMPLIANCE RULES:
    - Use ONLY conditional language ("if inaccurate", "may be inconsistent")
    - NEVER guarantee deletion or outcomes
    - NEVER provide legal advice
    - Focus on education and information verification
    - All content must be educational only`;

    // Use specific prompt for letter type if available, otherwise use a generic description
    const typeSpecificPrompt = prompts[letterType] || `Create a ${letterType} letter that is strictly educational and compliant.`;

    const compliancePrompt = `MANDATORY COMPLIANCE:
    - Use phrases like "if this information is inaccurate" or "should this be found inconsistent"
    - REFUSE any requests for guaranteed deletion
    - REFUSE legal strategy advice
    - Emphasize educational purpose only
    - Include verification language only`;

    const constructedSystemPrompt = `${systemPrompt}

${compliancePrompt}

${typeSpecificPrompt}`;
    const finalSystemPrompt = fullSystemPrompt || constructedSystemPrompt;

    // Use provided document content if available
    let documentAnalysis = '';
    if (documentContent) {
      documentAnalysis = `

UPLOADED DOCUMENTS CONTENT:
${documentContent}
`;
      documentAnalysis += `\n\nINSTRUCTION: Analyze the above document content to identify:\n`;
      documentAnalysis += `- Any missing information that should be present\n`;
      documentAnalysis += `- Inconsistent information across documents\n`;
      documentAnalysis += `- Potential inaccuracies that may need verification\n`;
      documentAnalysis += `- Account details that may be incomplete or incorrect\n`;
      documentAnalysis += `\nUse this analysis to create a more informed educational letter that references specific items from the documents when appropriate.`;
    }

    const userPrompt = `Create a credit ${letterType} letter with these details:
    - User: ${userName}
    - Address: ${userAddress}
    - Creditor: ${creditorName}
    - Account: ${accountNumber}
    - Reason: ${disputeReason}
    - Bureau: ${bureau}
    ${documentAnalysis}
    
    Make it professional, educational, and compliant with credit reporting laws.
    ${documentAnalysis ? 'Reference specific information from the uploaded documents when identifying potential issues, but use conditional language (e.g., "if this information is inaccurate" or "should this be found inconsistent").' : ''}`;

    logDebug('Sending request to OpenAI...');
    const startAi = Date.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });
    logDebug(`OpenAI response received (took ${Date.now() - startAi}ms)`);

    const generatedLetter = completion.choices[0]?.message?.content || 'Failed to generate letter';

    // Get disclaimer from database
    logDebug('Fetching disclaimer...');
    const startDisclaimer = Date.now();
    const disclaimerData = await prisma.disclaimer.findFirst({
      where: { type: 'letters', enabled: true }
    });
    const disclaimer = disclaimerData?.content || 'This letter is for educational purposes only and does not constitute legal advice.';
    logDebug(`Disclaimer fetched (took ${Date.now() - startDisclaimer}ms)`);

    const finalLetter = `${generatedLetter}\n\n---\nEDUCATIONAL DISCLAIMER: ${disclaimer}`;

    // Validate required fields before saving
    if (!bureau || !creditorName || !letterType || !finalLetter) {
      logDebug('Validation failed: Missing fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bureau, creditorName, letterType, and content are required'
      }, { status: 400 });
    }

    console.log('Saving letter to database...');
    logDebug('Saving letter to database...');
    const startSave = Date.now();
    await prisma.creditLetter.create({
      data: {
        userId: userId,
        bureau,
        creditorName,
        accountNumber: accountNumber || null,
        letterType,
        tone: 'professional',
        content: finalLetter
      }
    });
    logDebug(`Letter saved successfully (took ${Date.now() - startSave}ms)`);

    // No file cleanup needed since we're not storing files on the server
    // The file content is sent directly from the client

    return NextResponse.json({
      success: true,
      data: { letter: finalLetter }
    });

  } catch (error: any) {
    logDebug(`CRITICAL: Letter generation error: ${error}`);
    if (error.stack) logDebug(`Stack trace: ${error.stack}`);

    // Customize error message for better user guidance
    let errorMessage = error instanceof Error ? error.message : String(error);

    // Check for OpenAI specific errors or network issues
    if (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorMessage = 'The request to AI service timed out. Please try again.';
    } else if (errorMessage.includes('API key')) {
      errorMessage = 'AI service configuration error. Please contact support.';
    } else if (errorMessage.includes('rate limit')) {
      errorMessage = 'The AI service is currently busy. Please try again in a moment.';
    }

    return NextResponse.json(
      { success: false, error: errorMessage || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    logDebug('--- Letter Generation Request Ended ---');
  }
}