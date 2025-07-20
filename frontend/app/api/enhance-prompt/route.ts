import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ENHANCE PROMPT API CALLED ===');
    console.log('Environment check:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
    
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      console.log('Invalid prompt received');
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_PROMPT_ENHANCE_API_KEY;
    console.log('=== API KEY DEBUG ===');
    console.log('API key exists:', !!apiKey);
    console.log('API key length:', apiKey?.length || 0);
    console.log('API key preview:', apiKey ? `${apiKey.substring(0, 15)}...` : 'UNDEFINED');
    
    if (!apiKey) {
      console.log('No API key found');
      return NextResponse.json(
        { error: 'Gemini Prompt Enhance API key not configured' },
        { status: 500 }
      );
    }

    const enhancementPrompt = `Refine this user input for clarity and structure. Fix grammar, organize information logically, and make it more detailed while preserving the original meaning. Keep it concise.
    Make sure:
    - Only restructure and enhance the user prompt
    - Do not add any new information or make it too long
    - Never answer the user prompt, as your job is to enhance it to make it more cleaner and easier to understand

User Input: "${prompt}"

Refined Output:`;

    console.log('Making request to Gemini API');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: enhancementPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    clearTimeout(timeoutId);
    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} - ${errorData}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Gemini API response data:', JSON.stringify(data, null, 2));
    
    const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('Enhanced prompt:', enhancedPrompt);

    if (!enhancedPrompt) {
      console.log('No enhanced prompt received from API');
      return NextResponse.json(
        { error: 'No enhanced prompt received' },
        { status: 500 }
      );
    }

    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 