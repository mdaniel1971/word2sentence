'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from '@supabase/supabase-js';

interface NavBarProps {
  user: User | null;
}

export function NavBar({ user }: NavBarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-amber-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <span className="text-xl font-arabic text-stone-900">ق</span>
            </div>
            <span className="text-xl font-semibold text-amber-50">word2sentence</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-stone-300 hover:text-amber-400 hover:bg-stone-800/50">My Decks</Button>
                </Link>
                <Link href="/upload">
                  <Button variant="ghost" className="text-stone-300 hover:text-amber-400 hover:bg-stone-800/50">Upload</Button>
                </Link>
                <Link href="/progress">
                  <Button variant="ghost" className="text-stone-300 hover:text-amber-400 hover:bg-stone-800/50">Progress</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-10 h-10 rounded-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-400">
                      {user.email?.[0].toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-stone-900 border-stone-800">
                    <DropdownMenuItem className="text-stone-400 focus:bg-stone-800 focus:text-amber-400">{user.email}</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-stone-800" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:bg-stone-800 focus:text-red-300 cursor-pointer">Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-stone-300 hover:text-amber-400 hover:bg-stone-800/50">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
