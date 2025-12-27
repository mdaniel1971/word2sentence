'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VocabWordJSON } from '@/types';
import { User } from '@supabase/supabase-js';

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<VocabWordJSON[] | null>(null);
  const [deckName, setDeckName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('Arabic');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) router.push('/login');
    };
    getUser();
  }, [supabase, router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setError(null);
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) throw new Error('JSON must be an array');
        if (json.length === 0) throw new Error('JSON array is empty');
        const firstItem = json[0];
        if (!firstItem.source_term || !firstItem.target_term) throw new Error('Each item must have source_term and target_term');
        setParsedData(json);
        if (firstItem.deck_id) {
          setDeckName(firstItem.deck_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));
        } else {
          setDeckName(file.name.replace('.json', ''));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON');
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/json': ['.json'] }, maxFiles: 1 });

  const handleUpload = async () => {
    if (!parsedData || !deckName || !user) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const { data: deck, error: deckError } = await supabase.from('decks').insert({
        user_id: user.id, name: deckName,
        deck_id: parsedData[0]?.deck_id || deckName.toLowerCase().replace(/\s+/g, '-'),
        source_language: sourceLanguage, target_language: targetLanguage,
      }).select().single();
      if (deckError) throw deckError;
      setProgress(20);
      const batchSize = 100;
      const totalBatches = Math.ceil(parsedData.length / batchSize);
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize).map((word) => ({
          deck_id: deck.id, word_type: word.word_type || 'unknown',
          source_term: word.source_term, target_term: word.target_term, details: word.details || null,
        }));
        const { error: wordsError } = await supabase.from('words').insert(batch);
        if (wordsError) throw wordsError;
        setProgress(20 + ((Math.floor(i / batchSize) + 1) / totalBatches) * 80);
      }
      setProgress(100);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload deck');
      setUploading(false);
    }
  };

  const resetUpload = () => { setFile(null); setParsedData(null); setDeckName(''); setError(null); setProgress(0); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <NavBar user={user} />
      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-50">Upload Vocabulary Deck</h1>
          <p className="text-stone-400 mt-1">Import your vocabulary list from a JSON file</p>
        </div>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-xl text-amber-50">Select JSON File</CardTitle>
            <CardDescription className="text-stone-400">Upload a JSON file containing your vocabulary words</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
            {!parsedData ? (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-amber-500 bg-amber-500/5' : 'border-stone-700 hover:border-amber-700/50 hover:bg-stone-800/30'}`}>
                <input {...getInputProps()} />
                <p className="text-amber-50 font-medium mb-1">{isDragActive ? 'Drop the file here...' : 'Drag and drop your JSON file here'}</p>
                {!isDragActive && <p className="text-stone-500 text-sm">or click to browse</p>}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-stone-800/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-amber-50 font-medium">{file?.name}</p>
                    <p className="text-stone-400 text-sm">{parsedData.length} vocabulary items</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetUpload} className="text-stone-400 hover:text-red-400">Remove</Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deckName" className="text-amber-100">Deck Name</Label>
                    <Input id="deckName" value={deckName} onChange={(e) => setDeckName(e.target.value)} className="bg-stone-800/50 border-stone-700 text-amber-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-amber-100">Source Language</Label>
                      <Input value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className="bg-stone-800/50 border-stone-700 text-amber-50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-100">Target Language</Label>
                      <Input value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="bg-stone-800/50 border-stone-700 text-amber-50" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-100">Preview (first 5 items)</Label>
                  <div className="bg-stone-800/30 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-stone-800/50"><tr><th className="px-4 py-2 text-left text-amber-400">Source</th><th className="px-4 py-2 text-left text-amber-400">Target</th><th className="px-4 py-2 text-left text-amber-400">Type</th></tr></thead>
                      <tbody>{parsedData.slice(0, 5).map((word, i) => (
                        <tr key={i} className="border-t border-stone-800/50"><td className="px-4 py-2 text-amber-50 font-arabic text-lg" dir="rtl">{word.source_term}</td><td className="px-4 py-2 text-stone-300">{word.target_term}</td><td className="px-4 py-2 text-stone-500 capitalize">{word.word_type}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-stone-400">Uploading...</span><span className="text-amber-400">{Math.round(progress)}%</span></div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                <div className="flex gap-4">
                  <Button onClick={handleUpload} disabled={uploading || !deckName} className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900">{uploading ? 'Uploading...' : 'Upload Deck'}</Button>
                  <Button variant="outline" onClick={resetUpload} disabled={uploading} className="border-stone-700 text-stone-300 hover:bg-stone-800">Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
