import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const anthropic = getAnthropicClient();
    const body = await request.json();
    const { sentence, correctTranslation, userAnswer, sourceLanguage, targetLanguage } = body as {
      sentence: string;
      correctTranslation: string;
      userAnswer: string;
      sourceLanguage: string;
      targetLanguage: string;
    };

    if (!sentence || !correctTranslation || !userAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `You are a language learning assistant grading a translation exercise.

Original sentence (${sourceLanguage}):
"${sentence}"

Expected translation (${targetLanguage}):
"${correctTranslation}"

Student's answer:
"${userAnswer}"

Grade this translation. Be FLEXIBLE and GENEROUS:
- Accept synonyms and alternative phrasings that convey the same meaning
- Accept minor spelling mistakes if the word is still recognizable
- Accept different but valid grammatical structures
- Accept informal/formal variations
- Focus on meaning preservation, not exact wording

Return ONLY a JSON object with this exact format:
{
  "isCorrect": true or false,
  "score": number between 0 and 100,
  "feedback": "Brief explanation of the grade",
  "suggestedCorrection": "Only if incorrect, show a correct version"
}

A score of 70 or higher should be considered "correct" for learning purposes.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // Extract text from the response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Parse the JSON response
    let gradeResult: {
      isCorrect: boolean;
      score: number;
      feedback: string;
      suggestedCorrection?: string;
    };
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradeResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch {
      console.error('Failed to parse grading response:', responseText);
      // Fall back to simple string comparison
      const normalize = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '');
      const isCorrect = normalize(userAnswer) === normalize(correctTranslation);
      gradeResult = {
        isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? 'Correct!' : 'Not quite right.',
        suggestedCorrection: isCorrect ? undefined : correctTranslation,
      };
    }

    // Consider scores >= 70 as correct for learning purposes
    gradeResult.isCorrect = gradeResult.score >= 70;

    return NextResponse.json(gradeResult);
  } catch (error) {
    console.error('Error grading answer:', error);
    return NextResponse.json({ error: 'Failed to grade answer' }, { status: 500 });
  }
}

