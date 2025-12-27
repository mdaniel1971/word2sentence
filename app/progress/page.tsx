import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface QuizSessionWithDeck { id: string; deck_id: string; quiz_type: string; direction: string; total_questions: number; correct_answers: number; completed_at: string | null; created_at: string; decks: { name: string; source_language: string; target_language: string }; }
interface WordStats { word_id: string; source_term: string; target_term: string; total_attempts: number; correct_attempts: number; accuracy: number; }

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sessions } = await supabase.from('quiz_sessions').select('*, decks (name, source_language, target_language)').eq('user_id', user.id).not('completed_at', 'is', null).order('created_at', { ascending: false }).limit(20);
  const { data: wordStats } = await supabase.from('quiz_answers').select('word_id, is_correct, words (source_term, target_term)');

  const totalSessions = sessions?.length || 0;
  const totalQuestions = sessions?.reduce((acc, s) => acc + s.total_questions, 0) || 0;
  const totalCorrect = sessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0;
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const wordStatsMap = new Map<string, WordStats>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wordStats?.forEach((answer: any) => {
    const words = answer.words;
    if (!words || (Array.isArray(words) && words.length === 0)) return;
    const wordData = Array.isArray(words) ? words[0] : words;
    if (!wordData) return;
    const existing = wordStatsMap.get(answer.word_id);
    if (existing) { existing.total_attempts++; if (answer.is_correct) existing.correct_attempts++; existing.accuracy = Math.round((existing.correct_attempts / existing.total_attempts) * 100); }
    else wordStatsMap.set(answer.word_id, { word_id: answer.word_id, source_term: wordData.source_term, target_term: wordData.target_term, total_attempts: 1, correct_attempts: answer.is_correct ? 1 : 0, accuracy: answer.is_correct ? 100 : 0 });
  });
  const weakestWords = Array.from(wordStatsMap.values()).filter((w) => w.total_attempts >= 2).sort((a, b) => a.accuracy - b.accuracy).slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <NavBar user={user} />
      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-bold text-amber-50">Progress Tracking</h1><p className="text-stone-400 mt-1">Monitor your learning journey</p></div>
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-stone-900/50 border-stone-800"><CardContent className="pt-6"><div className="text-center"><p className="text-4xl font-bold text-amber-400">{totalSessions}</p><p className="text-stone-400 text-sm mt-1">Quizzes Completed</p></div></CardContent></Card>
          <Card className="bg-stone-900/50 border-stone-800"><CardContent className="pt-6"><div className="text-center"><p className="text-4xl font-bold text-amber-400">{totalQuestions}</p><p className="text-stone-400 text-sm mt-1">Questions Answered</p></div></CardContent></Card>
          <Card className="bg-stone-900/50 border-stone-800"><CardContent className="pt-6"><div className="text-center"><p className="text-4xl font-bold text-emerald-400">{totalCorrect}</p><p className="text-stone-400 text-sm mt-1">Correct Answers</p></div></CardContent></Card>
          <Card className="bg-stone-900/50 border-stone-800"><CardContent className="pt-6"><div className="text-center"><p className={`text-4xl font-bold ${overallAccuracy >= 80 ? 'text-emerald-400' : overallAccuracy >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{overallAccuracy}%</p><p className="text-stone-400 text-sm mt-1">Overall Accuracy</p></div></CardContent></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader><CardTitle className="text-xl text-amber-50">Recent Quiz Sessions</CardTitle><CardDescription className="text-stone-400">Your last 20 completed quizzes</CardDescription></CardHeader>
            <CardContent>
              {!sessions || sessions.length === 0 ? <div className="text-center py-8 text-stone-400"><p>No quiz sessions yet</p><p className="text-sm mt-1">Complete a quiz to see your progress here</p></div> : (
                <div className="space-y-3">{(sessions as QuizSessionWithDeck[]).map((session) => {
                  const accuracy = Math.round((session.correct_answers / session.total_questions) * 100);
                  return (
                    <div key={session.id} className="p-4 bg-stone-800/30 rounded-lg border border-stone-800">
                      <div className="flex items-center justify-between mb-2">
                        <div><p className="text-amber-50 font-medium">{session.decks?.name || 'Unknown Deck'}</p><div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="bg-stone-800 text-stone-400 text-xs">{session.quiz_type === 'multiple_choice' ? 'Multiple Choice' : 'Type Answer'}</Badge><span className="text-stone-500 text-xs">{session.direction === 'source_to_target' ? `${session.decks?.source_language} to ${session.decks?.target_language}` : `${session.decks?.target_language} to ${session.decks?.source_language}`}</span></div></div>
                        <div className={`text-xl font-bold ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{accuracy}%</div>
                      </div>
                      <div className="flex items-center justify-between text-sm"><span className="text-stone-500">{session.correct_answers}/{session.total_questions} correct</span><span className="text-stone-500">{session.completed_at && new Date(session.completed_at).toLocaleDateString()}</span></div>
                      <Progress value={accuracy} className="h-1 mt-2" />
                    </div>
                  );
                })}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader><CardTitle className="text-xl text-amber-50">Words to Review</CardTitle><CardDescription className="text-stone-400">Focus on these words to improve your accuracy</CardDescription></CardHeader>
            <CardContent>
              {weakestWords.length === 0 ? <div className="text-center py-8 text-stone-400"><p>Not enough data yet</p><p className="text-sm mt-1">Complete more quizzes to see weak areas</p></div> : (
                <div className="space-y-3">{weakestWords.map((word) => (
                  <div key={word.word_id} className="p-4 bg-stone-800/30 rounded-lg border border-stone-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1"><p className="text-amber-50 font-arabic text-lg" dir="rtl">{word.source_term}</p><p className="text-stone-400 text-sm">{word.target_term}</p></div>
                      <div className="text-right"><p className={`text-lg font-bold ${word.accuracy >= 80 ? 'text-emerald-400' : word.accuracy >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{word.accuracy}%</p><p className="text-stone-500 text-xs">{word.correct_attempts}/{word.total_attempts} correct</p></div>
                    </div>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
