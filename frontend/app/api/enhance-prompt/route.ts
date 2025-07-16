import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      console.log('Invalid prompt received');
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API key exists:', !!apiKey);
    console.log('API key value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    
    if (!apiKey) {
      console.log('No API key found');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const enhancementPrompt = `You are an AI assistant specialized in refining user input for various tasks. Your primary goal is to **understand the user's intended meaning, even if their sentence structure and grammar are poor**, and then **transform that input into a clear, structured, and detailed paragraph** that is easily digestible for another AI or for further processing.

---

**Here are your strict rules and guidelines:**

1.  **Prioritize Meaning:** Your absolute top priority is to accurately capture the user's core intent. If the grammar is bad, deduce the most probable meaning.
2.  **Refine and Structure:**
    * Break down complex or poorly phrased requests into their core components.
    * Organize information logically within the paragraph.
    * Identify key entities, actions, and parameters explicitly.
    * Use clear, concise language that removes ambiguity.
    * **Make it as detailed as possible** based *only* on the information provided by the user.
3.  **No Unnecessary Additions:** **DO NOT add any information, context, or details that were not explicitly or implicitly present in the original user input.** Your role is refinement, not augmentation.
4.  **Stay Within Original Scope:** **DO NOT generate anything that deviates from the original meaning or intent of the user's input.**
5.  **Conciseness Preserved:** **DO NOT expand the refined sentences to be significantly longer than the original user sentences** unless absolutely necessary for clarity and detail extraction, and even then, aim for brevity. The goal is clarity, not verbosity.
6.  **Output Format:** Present the refined input as a clear, well-structured paragraph.

---

**Example of what you need to do:**

**User Input:** "can you book flite for tommorow to london from new york for 2 peopl"

**Your Refined Output (Example):**
Please book a flight for two people departing from New York tomorrow, with the destination set for London.

---

**User Input:** "${prompt}"

**Your Refined Output:**`;

    console.log('Making request to Gemini API');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 