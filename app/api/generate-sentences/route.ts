import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey });
}

interface WordInput {
  id: string;
  source_term: string;
  target_term: string;
  word_type: string;
}

interface GeneratedSentence {
  wordId: string;
  originalWord: string;
  sentence: string;
  translation: string;
}

export async function POST(request: NextRequest) {
  try {
    const anthropic = getAnthropicClient();
    const body = await request.json();
    const { words, count, sourceLanguage, targetLanguage, direction } = body as {
      words: WordInput[];
      count: number;
      sourceLanguage: string;
      targetLanguage: string;
      direction: 'source_to_target' | 'target_to_source';
    };

    if (!words || !count || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Randomly select words for the quiz
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(count, words.length));

    // Determine which language to generate sentences in based on direction
    const sentenceLanguage = direction === 'source_to_target' ? sourceLanguage : targetLanguage;
    const translationLanguage = direction === 'source_to_target' ? targetLanguage : sourceLanguage;
    
    // Build the word list for the prompt
    const wordList = selectedWords.map((w, i) => {
      const term = direction === 'source_to_target' ? w.source_term : w.target_term;
      return \`\${i + 1}. "\${term}" (\${w.word_type})\`;
    }).join('\n');

    // Check if Arabic to add tashkeel instruction
    const isArabic = sentenceLanguage.toLowerCase().includes('arabic');
    const tashkeelInstruction = isArabic 
      ? \`\\n- CRITICAL: Include FULL tashkeel (harakat/diacritics) on ALL Arabic words in the sentence - every letter should have its appropriate vowel mark (fatha, damma, kasra, sukun, shadda, tanween, etc.). This is essential for learners.\`
      : '';

    const prompt = \`Create \${selectedWords.length} simple, beginner-friendly sentences using the following \${sentenceLanguage} words. Each sentence should be short (5-10 words) and use the word in a clear context.

Words:
\${wordList}

For each sentence, also provide the accurate translation in \${translationLanguage}.

IMPORTANT: Return your response as a valid JSON array with exactly this format, and nothing else:
[
  {
    "wordIndex": 0,
    "sentence": "The sentence in \${sentenceLanguage}",
    "translation": "The translation in \${translationLanguage}"
  }
]

Rules:
- Use simple, everyday vocabulary beyond the target word
- Keep sentences clear and grammatically correct
- Make sentences natural and useful for language learners
- The translation should be natural, not word-for-word literal\${tashkeelInstruction}
- Return ONLY the JSON array, no other text\`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
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
    let parsedSentences: { wordIndex: number; sentence: string; translation: string }[];
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedSentences = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Map the response back to our word structure
    const sentences: GeneratedSentence[] = parsedSentences.map((item) => {
      const word = selectedWords[item.wordIndex];
      return {
        wordId: word.id,
        originalWord: direction === 'source_to_target' ? word.source_term : word.target_term,
        sentence: item.sentence,
        translation: item.translation,
      };
    });

    return NextResponse.json({ sentences });
  } catch (error) {
    console.error('Error generating sentences:', error);
    return NextResponse.json({ error: 'Failed to generate sentences' }, { status: 500 });
  }
}
