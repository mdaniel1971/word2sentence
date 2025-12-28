'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Word, Deck } from '@/types';

interface QuizClientProps { deck: Deck; words: Word[]; userId: string; }
type Direction = 'source_to_target' | 'target_to_source';

interface GeneratedQuestion {
  wordId: string;
  originalWord: string;
  sentence: string;
  translation: string;
}

interface GradeResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestedCorrection?: string;
}

interface AnswerRecord {
  wordId: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
}

export function QuizClient({ deck, words, userId }: QuizClientProps) {
  const [direction, setDirection] = useState<Direction>('source_to_target');
  const [questionCount, setQuestionCount] = useState(5);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const generateQuestions = useCallback(async (): Promise<GeneratedQuestion[]> => {
    const response = await fetch('/api/generate-sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        words: words.map(w => ({
          id: w.id,
          source_term: w.source_term,
          target_term: w.target_term,
          word_type: w.word_type,
        })),
        count: questionCount,
        sourceLanguage: deck.source_language,
        targetLanguage: deck.target_language,
        direction,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate sentences');
    }

    const data = await response.json();
    return data.sentences;
  }, [words, questionCount, direction, deck.source_language, deck.target_language]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const newQuestions = await generateQuestions();
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setAnswers([]);
      setIsComplete(false);
      setTypedAnswer('');
      setShowResult(false);
      setGradeResult(null);
      
      const { data: session, error } = await supabase.from('quiz_sessions').insert({
        user_id: userId,
        deck_id: deck.id,
        quiz_type: 'sentence',
        direction,
        total_questions: newQuestions.length,
        correct_answers: 0,
      }).select().single();
      
      if (!error && session) setSessionId(session.id);
      setStarted(true);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to generate quiz. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!typedAnswer.trim()) return;
    
    setIsGrading(true);
    const currentQuestion = questions[currentIndex];
    
    try {
      const response = await fetch('/api/grade-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: currentQuestion.sentence,
          correctTranslation: currentQuestion.translation,
          userAnswer: typedAnswer.trim(),
          sourceLanguage: direction === 'source_to_target' ? deck.source_language : deck.target_language,
          targetLanguage: direction === 'source_to_target' ? deck.target_language : deck.source_language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grade answer');
      }

      const result: GradeResult = await response.json();
      setGradeResult(result);
      setShowResult(true);
      
      const answerRecord: AnswerRecord = {
        wordId: currentQuestion.wordId,
        userAnswer: typedAnswer.trim(),
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.feedback,
      };
      
      setAnswers([...answers, answerRecord]);
      
      if (sessionId) {
        await supabase.from('quiz_answers').insert({
          session_id: sessionId,
          word_id: currentQuestion.wordId,
          user_answer: typedAnswer.trim(),
          is_correct: result.isCorrect,
        });
      }
    } catch (error) {
      console.error('Error grading answer:', error);
      // Fallback to simple comparison
      const normalize = (s: string) => s.toLowerCase().trim();
      const isCorrect = normalize(typedAnswer) === normalize(currentQuestion.translation);
      setGradeResult({
        isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? 'Correct!' : 'Not quite right.',
        suggestedCorrection: isCorrect ? undefined : currentQuestion.translation,
      });
      setShowResult(true);
      
      setAnswers([...answers, {
        wordId: currentQuestion.wordId,
        userAnswer: typedAnswer.trim(),
        isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? 'Correct!' : 'Not quite right.',
      }]);
    } finally {
      setIsGrading(false);
    }
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      setIsComplete(true);
      if (sessionId) {
        const correctCount = answers.filter((a) => a.isCorrect).length + (gradeResult?.isCorrect ? 1 : 0);
        await supabase.from('quiz_sessions').update({
          correct_answers: correctCount,
          completed_at: new Date().toISOString(),
        }).eq('id', sessionId);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
      setTypedAnswer('');
      setShowResult(false);
      setGradeResult(null);
    }
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedAnswer.trim() && !isGrading) checkAnswer();
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (!started) {
    return (
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-50">{deck.name}</CardTitle>
          <p className="text-stone-400">{words.length} words - {deck.source_language} to {deck.target_language}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-stone-800/50 rounded-xl p-4 border border-amber-800/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-amber-100 font-semibold">AI-Powered Learning</h3>
            </div>
            <p className="text-stone-400 text-sm">
              Our AI will create unique sentences using your vocabulary words. 
              Translate them to practice in context, with flexible grading that accepts synonyms and alternative phrasings.
            </p>
          </div>
          
          <div className="space-y-3">
            <label className="text-amber-100 font-medium">Translation Direction</label>
            <Tabs value={direction} onValueChange={(v) => setDirection(v as Direction)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-stone-800">
                <TabsTrigger value="source_to_target" className="data-[state=active]:bg-amber-600 data-[state=active]:text-stone-900">
                  {deck.source_language} → {deck.target_language}
                </TabsTrigger>
                <TabsTrigger value="target_to_source" className="data-[state=active]:bg-amber-600 data-[state=active]:text-stone-900">
                  {deck.target_language} → {deck.source_language}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="space-y-3">
            <label className="text-amber-100 font-medium">Number of Sentences</label>
            <div className="flex gap-2 flex-wrap">
              {[3, 5, 10, 15].map((count) => (
                <Button
                  key={count}
                  variant={questionCount === count ? 'default' : 'outline'}
                  onClick={() => setQuestionCount(count)}
                  disabled={count > words.length}
                  className={questionCount === count
                    ? 'bg-amber-600 text-stone-900'
                    : 'border-stone-700 text-stone-300 hover:border-amber-700/50'}
                >
                  {count}
                </Button>
              ))}
              {words.length > 15 && (
                <Button
                  variant={questionCount === words.length ? 'default' : 'outline'}
                  onClick={() => setQuestionCount(Math.min(words.length, 20))}
                  className={questionCount === words.length
                    ? 'bg-amber-600 text-stone-900'
                    : 'border-stone-700 text-stone-300 hover:border-amber-700/50'}
                >
                  Max (20)
                </Button>
              )}
            </div>
          </div>
          
          <Button
            onClick={startQuiz}
            size="lg"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-stone-900 font-semibold text-lg hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Sentences...
              </span>
            ) : (
              'Start Quiz'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const finalCorrect = answers.filter((a) => a.isCorrect).length;
    const percentage = Math.round((finalCorrect / questions.length) * 100);
    const avgScore = Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length);
    
    return (
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
              percentage >= 80 ? 'bg-emerald-500/20' : percentage >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
              <span className={`text-4xl font-bold ${
                percentage >= 80 ? 'text-emerald-400' : percentage >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {percentage}%
              </span>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-amber-50 mb-2">Quiz Complete!</h2>
              <p className="text-stone-400">
                You got <span className="text-amber-400 font-semibold">{finalCorrect}</span> out of{' '}
                <span className="text-amber-400 font-semibold">{questions.length}</span> correct
              </p>
              <p className="text-stone-500 text-sm mt-1">
                Average accuracy: {avgScore}%
              </p>
            </div>
            
            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={() => {
                  setStarted(false);
                  setIsComplete(false);
                  setQuestions([]);
                  setAnswers([]);
                }}
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-stone-900"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-stone-700 text-stone-300 hover:border-amber-700/50"
              >
                Back to Decks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isRtl = direction === 'source_to_target' && ['Arabic', 'Hebrew', 'Persian', 'Urdu'].some(
    lang => deck.source_language.toLowerCase().includes(lang.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-stone-400">Sentence {currentIndex + 1} of {questions.length}</span>
          <span className="text-amber-400">{correctCount} correct</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader className="text-center pb-4">
          {/* Target word displayed prominently */}
          <div className="mb-6">
            <p className="text-stone-500 text-sm mb-2">Word being tested:</p>
            <div 
              className={`text-4xl sm:text-5xl font-bold text-amber-400 ${isRtl ? 'font-arabic' : ''}`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {currentQuestion.originalWord}
            </div>
          </div>
          
          {/* Sentence to translate */}
          <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
            <p className="text-stone-500 text-xs mb-2 uppercase tracking-wide">Translate this sentence:</p>
            <CardTitle
              className={`text-xl sm:text-2xl leading-relaxed ${isRtl ? 'font-arabic' : ''}`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <span className="text-amber-50">{currentQuestion.sentence}</span>
            </CardTitle>
          </div>
          
          <p className="text-stone-500 mt-4">
            Translate to {direction === 'source_to_target' ? deck.target_language : deck.source_language}
          </p>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleTypeSubmit} className="space-y-4">
            <Input
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Type your translation..."
              disabled={showResult || isGrading}
              className={`text-lg p-4 h-auto bg-stone-800/50 border-stone-700 text-amber-50 placeholder:text-stone-500 ${
                direction === 'target_to_source' && isRtl ? 'font-arabic text-right' : ''
              }`}
              dir={direction === 'target_to_source' && isRtl ? 'rtl' : 'ltr'}
              autoFocus
            />
            
            {showResult && gradeResult && (
              <div className={`p-4 rounded-lg space-y-2 ${
                gradeResult.isCorrect
                  ? 'bg-emerald-600/20 border border-emerald-500/50'
                  : 'bg-amber-600/20 border border-amber-500/50'
              }`}>
                <div className="flex items-center justify-between">
                  <p className={gradeResult.isCorrect ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {gradeResult.isCorrect ? '✓ Correct!' : 'Almost there!'}
                  </p>
                  <Badge className={`${
                    gradeResult.score >= 80 ? 'bg-emerald-600' : gradeResult.score >= 50 ? 'bg-amber-600' : 'bg-red-600'
                  } text-white`}>
                    {gradeResult.score}%
                  </Badge>
                </div>
                <p className="text-stone-300 text-sm">{gradeResult.feedback}</p>
                {gradeResult.suggestedCorrection && (
                  <p className="text-stone-400 text-sm">
                    Expected: <span className="text-amber-300 font-medium">{gradeResult.suggestedCorrection}</span>
                  </p>
                )}
              </div>
            )}
            
            {!showResult && (
              <Button
                type="submit"
                disabled={!typedAnswer.trim() || isGrading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-stone-900 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
              >
                {isGrading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Grading...
                  </span>
                ) : (
                  'Check Answer'
                )}
              </Button>
            )}
          </form>
          
          {showResult && (
            <Button
              onClick={nextQuestion}
              className="w-full mt-4 bg-gradient-to-r from-amber-600 to-amber-700 text-stone-900 hover:from-amber-500 hover:to-amber-600"
            >
              {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Sentence'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
