'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface WordAnalysis {
  originalWord: string;
  rootForm: string;
  wordType: string;
  translation: string;
  details: Record<string, unknown>;
}

interface ClickableWordProps {
  word: string;
  deckId: string;
  sourceLanguage: string;
  targetLanguage: string;
  isRtl: boolean;
  onWordSaved?: () => void;
}

const LONG_PRESS_DURATION = 500; // ms

export function ClickableWord({ 
  word, 
  deckId, 
  sourceLanguage, 
  targetLanguage, 
  isRtl,
  onWordSaved 
}: ClickableWordProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<WordAnalysis | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        wordRef.current &&
        !wordRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
        setMessage(null);
        setAnalysis(null);
      }
    }

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showPopover]);

  const analyzeWord = useCallback(async () => {
    setAnalyzing(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/analyze-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to analyze word' });
      }
    } catch (error) {
      console.error('Error analyzing word:', error);
      setMessage({ type: 'error', text: 'Failed to analyze word' });
    } finally {
      setAnalyzing(false);
    }
  }, [word, sourceLanguage, targetLanguage]);

  const openPopover = useCallback(() => {
    setShowPopover(true);
    setMessage(null);
    setAnalysis(null);
    analyzeWord();
  }, [analyzeWord]);

  // Desktop: click to open
  const handleClick = (e: React.MouseEvent) => {
    // Prevent if this was a long press
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    e.preventDefault();
    openPopover();
  };

  // Mobile: long press to open
  const handleTouchStart = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      openPopover();
    }, LONG_PRESS_DURATION);
  }, [openPopover]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!analysis) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          deckId,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const result = await response.json();

      if (result.exists) {
        setMessage({ type: 'info', text: result.message });
      } else if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onWordSaved?.();
        // Auto-close after success
        setTimeout(() => {
          setShowPopover(false);
          setMessage(null);
          setAnalysis(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save word' });
      }
    } catch (error) {
      console.error('Error saving word:', error);
      setMessage({ type: 'error', text: 'Failed to save word' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowPopover(false);
    setMessage(null);
    setAnalysis(null);
  };

  return (
    <span className="relative inline-block">
      <span
        ref={wordRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className={`cursor-pointer hover:bg-amber-500/20 hover:text-amber-300 rounded px-0.5 transition-colors select-none ${
          showPopover ? 'bg-amber-500/30 text-amber-300' : ''
        }`}
      >
        {word}
      </span>
      
      {showPopover && (
        <div
          ref={popoverRef}
          className={`absolute z-50 mt-2 p-3 bg-stone-800 border border-stone-700 rounded-lg shadow-xl min-w-[200px] ${
            isRtl ? 'right-0' : 'left-0'
          }`}
          style={{ top: '100%' }}
        >
          {message ? (
            <div className={`text-sm ${
              message.type === 'success' ? 'text-emerald-400' : 
              message.type === 'error' ? 'text-red-400' : 
              'text-amber-400'
            }`}>
              {message.text}
            </div>
          ) : analyzing ? (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </div>
          ) : analysis ? (
            <div className="text-left leading-relaxed">
              <p className="text-stone-400 text-base mb-2">Save word?</p>
              <p className={`text-2xl font-bold text-amber-400 mb-2 leading-loose ${isRtl ? 'font-arabic' : ''}`}>
                {analysis.rootForm}
              </p>
              <p className="text-stone-500 text-base mb-2">
                <span className="text-stone-600">(from </span>
                <span className={`text-xl font-arabic`}>{analysis.originalWord}</span>
                <span className="text-stone-600">)</span>
              </p>
              <p className="text-stone-300 text-base mb-4">
                {analysis.translation} <span className="text-stone-500">• {analysis.wordType}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 h-7"
                >
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Yes'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="border-stone-600 text-stone-400 hover:bg-stone-700 text-xs px-3 py-1 h-7"
                >
                  No
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </span>
  );
}

interface ClickableSentenceProps {
  sentence: string;
  deckId: string;
  sourceLanguage: string;
  targetLanguage: string;
  isRtl: boolean;
  excludeWord?: string;
  onWordSaved?: () => void;
}

export function ClickableSentence({
  sentence,
  deckId,
  sourceLanguage,
  targetLanguage,
  isRtl,
  excludeWord,
  onWordSaved,
}: ClickableSentenceProps) {
  // Split sentence into words while preserving spaces and punctuation
  const parts = sentence.split(/(\s+)/);
  
  return (
    <span>
      {parts.map((part, index) => {
        // Check if this is a word (not whitespace or punctuation only)
        const isWord = /[؀-ۿ\w]+/.test(part);
        
        // Check if this word matches the excluded word (the word being tested)
        const isExcluded = excludeWord && part.includes(excludeWord);
        
        // Excluded words (already in deck) render without click functionality
        if (isWord && isExcluded) {
          return <span key={index} className="text-amber-300">{part}</span>;
        }
        
        // Regular words are clickable
        if (isWord) {
          return (
            <ClickableWord
              key={index}
              word={part}
              deckId={deckId}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              isRtl={isRtl}
              onWordSaved={onWordSaved}
            />
          );
        }
        
        // Return spaces and punctuation as-is
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
