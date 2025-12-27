import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/NavBar';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNkNGFmMzciIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 fixed"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      
      <NavBar user={user} />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 -mt-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Arabic calligraphy decoration */}
          <div className="mb-8 animate-fade-in">
            <span className="text-8xl font-arabic text-amber-500/20">بِسْمِ</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold text-amber-50 mb-6 animate-fade-in-up">
            word2sentence
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              Learn in Context
            </span>
          </h1>
          
          <p className="text-xl text-stone-400 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Upload your vocabulary lists, and our AI creates sentences for you to translate. 
            Master languages through context, not just memorization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
            {user ? (
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900 font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 hover:shadow-amber-800/30 hover:scale-105"
                >
                  Go to Dashboard
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900 font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 hover:shadow-amber-800/30 hover:scale-105"
                  >
                    Get Started Free
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-amber-700/50 text-amber-400 hover:bg-amber-900/20 font-semibold text-lg px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Feature cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 animate-fade-in-up animation-delay-600">
          <div className="bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl p-6 hover:border-amber-800/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-50 mb-2">Upload Your Lists</h3>
            <p className="text-stone-400 text-sm">Import vocabulary from JSON files with support for multiple languages and word types.</p>
          </div>
          
          <div className="bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl p-6 hover:border-amber-800/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-50 mb-2">AI-Powered Sentences</h3>
            <p className="text-stone-400 text-sm">Our AI creates contextual sentences from your words for more meaningful learning.</p>
          </div>
          
          <div className="bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-2xl p-6 hover:border-amber-800/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-50 mb-2">Track Progress</h3>
            <p className="text-stone-400 text-sm">Monitor your learning journey with detailed statistics and identify areas to improve.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
