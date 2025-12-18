import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds timeout
});

export const maxDuration = 60;

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

    const { userName, creditorName, day = 30 } = await request.json();

    // Get AI prompts from database
    const promptsData = await prisma.aIPrompt.findMany({ where: { enabled: true } });
    const prompts = promptsData.reduce((acc: any, prompt: any) => {
      acc[prompt.type] = prompt.content;
      return acc;
    }, {});

    const systemPrompt = prompts.system || `You are an AI assistant that helps create educational follow-up letters. CRITICAL COMPLIANCE RULES:
    - Use ONLY conditional language ("if inaccurate", "may be inconsistent")
    - NEVER guarantee deletion or outcomes
    - NEVER provide legal advice
    - Focus on education and information verification
    - All content must be educational only
    - Follow-ups should request status updates, not demand action`;

    const userPrompt = `Create a follow-up letter for day ${day} regarding a credit dispute with these details:
    - User: ${userName}
    - Creditor: ${creditorName}
    - Day: ${day}
    
    Make it professional, educational, and compliant. Use conditional language like "if inaccurate" and "may be inconsistent".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const generatedLetter = completion.choices[0]?.message?.content || 'Failed to generate follow-up letter';

    // Get disclaimer from database
    const disclaimerData = await prisma.disclaimer.findFirst({
      where: { type: 'letters', enabled: true }
    });
    const disclaimer = disclaimerData?.content || 'This letter is for educational purposes only and does not constitute legal advice.';

    const finalLetter = `${generatedLetter}\n\n---\nEDUCATIONAL DISCLAIMER: ${disclaimer}`;

    // Create or update follow-up letter
    // If we want to keep history of all follow-ups, we should just create.
    // However, if the requirement implies "reuse", maybe it means generating different versions?
    // The requirement says "Enable 15 / 30 / 45 day follow-ups... Save to Database".
    // I'll create new entries for history.

    await prisma.followUpLetter.create({
      data: {
        userId: userId,
        day: Number(day),
        content: finalLetter,
      },
    });

    return NextResponse.json({
      success: true,
      data: { letter: finalLetter }
    });

  } catch (error: any) {
    console.error('Follow-up generation error:', error);

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
  }
}