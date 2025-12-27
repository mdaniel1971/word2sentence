'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-4">
        <Card className="w-full max-w-md relative z-10 bg-stone-900/90 border-amber-900/30 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-semibold text-amber-50">Check Your Email</CardTitle>
            <CardDescription className="text-stone-400">
              We have sent a confirmation link to <span className="text-amber-400">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-stone-400 text-sm mb-4">
              Click the link in your email to verify your account and start learning.
            </p>
            <Button onClick={() => router.push('/login')} variant="outline" className="border-amber-700/50 text-amber-400 hover:bg-amber-900/20">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-4">
      <Card className="w-full max-w-md relative z-10 bg-stone-900/90 border-amber-900/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mb-2">
            <span className="text-3xl font-arabic text-stone-900">ق</span>
          </div>
          <CardTitle className="text-2xl font-semibold text-amber-50">Create Account</CardTitle>
          <CardDescription className="text-stone-400">Start your vocabulary learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-100">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-stone-800/50 border-stone-700 text-amber-50 placeholder:text-stone-500 focus:border-amber-600" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-100">Password</Label>
              <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-stone-800/50 border-stone-700 text-amber-50 placeholder:text-stone-500 focus:border-amber-600" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-amber-100">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-stone-800/50 border-stone-700 text-amber-50 placeholder:text-stone-500 focus:border-amber-600" />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900 font-medium">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-stone-400">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
