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
    const body = await request.json();
    const { word, sourceLanguage, targetLanguage } = body as {
      word: string;
      sourceLanguage: string;
      targetLanguage: string;
    };

    if (!word || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const anthropic = getAnthropicClient();
    
    const analysisPrompt = `Analyze this ${sourceLanguage} word: "${word}"

Extract the following information and return as JSON:
1. root_form: The dictionary/root form of the word (remove prefixes like لِ، بِ، وَ، فَ، الـ and suffixes, get the base word with full tashkeel)
2. word_type: One of "noun", "verb", "adjective", "particle", "preposition", "adverb"
3. translation: The ${targetLanguage} translation of the root form
4. details: An object with relevant grammatical info:
   - For nouns/adjectives: include "source_plural" (Arabic plural with tashkeel) and "target_plural" (English plural)
   - For verbs: include "present" (present tense form with tashkeel), "verbal_noun" (masdar with tashkeel), "form" (Arabic verb form number 1-10)

Return ONLY valid JSON, no other text:
{
  "root_form": "...",
  "word_type": "...",
  "translation": "...",
  "details": {...}
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: analysisPrompt }]
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    let wordInfo: {
      root_form: string;
      word_type: string;
      translation: string;
      details: Record<string, unknown>;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        wordInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse word analysis:', responseText);
      return NextResponse.json({ error: 'Failed to analyze word' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      originalWord: word,
      rootForm: wordInfo.root_form,
      wordType: wordInfo.word_type,
      translation: wordInfo.translation,
      details: wordInfo.details,
    });
  } catch (error) {
    console.error('Error analyzing word:', error);
    return NextResponse.json({ error: 'Failed to analyze word' }, { status: 500 });
  }
}

