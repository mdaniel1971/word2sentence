import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NavBar } from '@/components/NavBar';
import { DeleteDeckButton } from '@/components/deck/DeleteDeckButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: decks } = await supabase
    .from('decks')
    .select('*, words(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const decksWithCount = decks?.map(deck => ({
    ...deck,
    word_count: deck.words?.[0]?.count || 0
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <NavBar user={user} />
      
      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-50">My Vocabulary Decks</h1>
            <p className="text-stone-400 mt-1">Manage your vocabulary collections and start quizzing</p>
          </div>
          <Link href="/upload">
            <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900 font-medium">
              Upload New Deck
            </Button>
          </Link>
        </div>

        {decksWithCount.length === 0 ? (
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold text-amber-50 mb-2">No decks yet</h3>
              <p className="text-stone-400 text-center mb-6 max-w-sm">Upload your first vocabulary JSON file to get started</p>
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900">Upload Your First Deck</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {decksWithCount.map((deck) => (
              <Card key={deck.id} className="bg-stone-900/50 border-stone-800 hover:border-amber-800/50 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-amber-50 group-hover:text-amber-400 transition-colors">{deck.name}</CardTitle>
                      <CardDescription className="text-stone-500 mt-1">{deck.source_language} → {deck.target_language}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-amber-900/30 text-amber-400 border-amber-800/50">{deck.word_count} words</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/quiz/${deck.id}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900">Start Quiz</Button>
                    </Link>
                    <DeleteDeckButton deckId={deck.id} deckName={deck.name} />
                  </div>
                  <p className="text-xs text-stone-500 mt-3">Created {new Date(deck.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
