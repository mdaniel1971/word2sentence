import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QuizClient } from '@/components/quiz/QuizClient';
import { NavBar } from '@/components/NavBar';
import { Word, Deck } from '@/types';

interface QuizPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { deckId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: deck, error: deckError } = await supabase.from('decks').select('*').eq('id', deckId).eq('user_id', user.id).single();
  if (deckError || !deck) redirect('/dashboard');

  const { data: words, error: wordsError } = await supabase.from('words').select('*').eq('deck_id', deckId);
  if (wordsError || !words || words.length === 0) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <NavBar user={user} />
      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <QuizClient deck={deck as Deck} words={words as Word[]} userId={user.id} />
      </main>
    </div>
  );
}
