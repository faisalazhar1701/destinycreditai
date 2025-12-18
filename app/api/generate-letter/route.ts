import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { readFile, appendFile } from 'fs/promises';
import { appendFileSync } from 'fs';
import path from 'path';

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
let pdf: any;

export const maxDuration = 60; // 60 seconds max duration for the route

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
      timeout: 60000,
    });
  }
  try {
    // Authenticate user
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      logDebug('Auth failed: No token');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
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
      documentIds,
      documentContent, // Optional direct content
      fullSystemPrompt // Optional override
    } = body;

    // Get AI prompts from database
    logDebug('Fetching prompts from database...');
    const promptsData = await prisma.aIPrompt.findMany({ where: { enabled: true } });
    logDebug(`Found ${promptsData.length} prompts`);
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

    const compliancePrompt = `MANDATORY COMPLIANCE:
    - Use phrases like "if this information is inaccurate" or "should this be found inconsistent"
    - REFUSE any requests for guaranteed deletion
    - REFUSE legal strategy advice
    - Emphasize educational purpose only
    - Include verification language only`;

    const constructedSystemPrompt = `${systemPrompt}\n\n${compliancePrompt}\n\nCreate a ${letterType} letter that is strictly educational and compliant.`;
    const finalSystemPrompt = fullSystemPrompt || constructedSystemPrompt;

    // Fetch document content if document IDs are provided
    let documentAnalysis = '';
    // Check for document IDs
    if (documentIds && documentIds.length > 0) {
      logDebug(`Processing ${documentIds.length} documents...`);
      const documents = await prisma.uploadedFile.findMany({
        where: { id: { in: documentIds } },
        include: { user: true }
      });

      if (documents.length > 0) {
        documentAnalysis = `\n\nUPLOADED DOCUMENTS CONTENT:\n`;

        for (const [index, doc] of documents.entries()) {
          try {
            logDebug(`Reading document ${index + 1}: ${doc.filename}`);
            documentAnalysis += `\n--- Document ${index + 1}: ${doc.filename} (${doc.fileType}) ---\n`;

            // Read file content if it exists
            const filePath = path.join(process.cwd(), 'public', doc.filepath);
            try {
              const fileBuffer = await readFile(filePath);

              if (doc.fileType === 'application/pdf' || doc.filename.toLowerCase().endsWith('.pdf')) {
                logDebug(`Parsing PDF: ${doc.filename}`);
                // Safely load pdf-parse only when needed
                if (!pdf) {
                  try {
                    logDebug('Requiring pdf-parse...');
                    pdf = require('pdf-parse');
                    logDebug('pdf-parse loaded successfully');
                  } catch (pdfError) {
                    logDebug(`Failed to load pdf-parse: ${pdfError}`);
                    throw new Error('PDF processing library not available. Please contact support.');
                  }
                }
                const pdfData = await pdf(fileBuffer);
                logDebug(`PDF parsed successfully, length: ${pdfData.text.length}`);
                // Limit text length to avoid token limits
                documentAnalysis += pdfData.text.substring(0, 5000);
                if (pdfData.text.length > 5000) documentAnalysis += '\n...[Content Truncated]...';
              } else if (doc.fileType.startsWith('image/')) {
                documentAnalysis += '[Image content - OCR not available using text-only model. User has attached this image as reference.]';
              } else {
                // Try to read as text
                documentAnalysis += fileBuffer.toString('utf-8').substring(0, 5000);
              }
            } catch (fsError) {
              console.error(`Error reading file ${filePath}:`, fsError);
              documentAnalysis += '[Error reading file content]';
            }
          } catch (e) {
            console.error(`Error processing document ${doc.id}:`, e);
          }
        }

        documentAnalysis += `\n\nINSTRUCTION: Analyze the above document content (if available) to identify:\n`;
        documentAnalysis += `- Any missing information that should be present\n`;
        documentAnalysis += `- Inconsistent information across documents\n`;
        documentAnalysis += `- Potential inaccuracies that may need verification\n`;
        documentAnalysis += `- Account details that may be incomplete or incorrect\n`;
        documentAnalysis += `\nUse this analysis to create a more informed educational letter that references specific items from the documents when appropriate.`;
      }
    }

    // Use provided document content if available
    if (documentContent) {
      documentAnalysis += `\n\nDOCUMENT CONTENT ANALYSIS:\n${documentContent}\n`;
      documentAnalysis += `\nPlease review the above document content and identify any missing, inconsistent, or potentially inaccurate information that should be addressed in the educational letter.`;
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });
    logDebug('OpenAI response received');

    const generatedLetter = completion.choices[0]?.message?.content || 'Failed to generate letter';

    // Get disclaimer from database
    logDebug('Fetching disclaimer...');
    const disclaimerData = await prisma.disclaimer.findFirst({
      where: { type: 'letters', enabled: true }
    });
    const disclaimer = disclaimerData?.content || 'This letter is for educational purposes only and does not constitute legal advice.';

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
    logDebug('Letter saved successfully');

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
    }

    return NextResponse.json(
      { success: false, error: errorMessage || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    logDebug('--- Letter Generation Request Ended ---');
  }
}